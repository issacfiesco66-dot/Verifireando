/**
 * Backend verifireando — Firebase-only (Auth + Firestore)
 */
'use strict'
const functions = require('firebase-functions/v1')
const express = require('express')
const cors = require('cors')
const admin = require('firebase-admin')

// Inicializa Firebase Admin (usa credenciales internas del entorno Functions)
admin.initializeApp()
const db = admin.firestore()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

// ================================
// Middlewares de autenticación y roles
// ================================
const getUserRole = async (uid) => {
  try {
    const snap = await db.collection('users').doc(uid).get()
    const data = snap.exists ? snap.data() : null
    return (data && data.role) || 'client'
  } catch (_) {
    return 'client'
  }
}

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ error: 'No autenticado' })

    const decoded = await admin.auth().verifyIdToken(token)
    req.user = { uid: decoded.uid, email: decoded.email || null }
    req.user.role = await getUserRole(decoded.uid)
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Solo admin' })
  }
  next()
}

// ================================
// Health check (público)
// ================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ================================
// Auth: registro administrado (opcional)
// ================================
app.post('/api/register', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role = 'client' } = req.body
    const userRecord = await admin.auth().createUser({ email, password, displayName: name || '' })

    await db.collection('users').doc(userRecord.uid).set({
      email,
      name: name || '',
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    res.status(201).json({ message: 'Usuario creado', uid: userRecord.uid })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/login', (req, res) => {
  // El login se hace en el FRONTEND con Firebase Auth
  res.status(400).json({ message: 'Usa Firebase Auth en el frontend para login' })
})

// ================================
// CRUD genérico de Firestore con ownership y admin
// ================================
// Crear
app.post('/api/data/:collection', requireAuth, async (req, res) => {
  try {
    const { collection } = req.params
    const data = req.body || {}

    // Si no es admin, forzar ownerId
    const payload = {
      ...data,
      ownerId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const ref = await db.collection(collection).add(payload)
    res.status(201).json({ id: ref.id })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Listar
app.get('/api/data/:collection', requireAuth, async (req, res) => {
  try {
    const { collection } = req.params
    let query = db.collection(collection).orderBy('createdAt', 'desc')

    if (req.user.role !== 'admin') {
      query = query.where('ownerId', '==', req.user.uid)
    }

    const snap = await query.get()
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    res.status(200).json(items)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Obtener por id
app.get('/api/data/:collection/:id', requireAuth, async (req, res) => {
  try {
    const { collection, id } = req.params
    const ref = db.collection(collection).doc(id)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).json({ error: 'No encontrado' })
    const data = doc.data()
    if (req.user.role !== 'admin' && data.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Sin permisos' })
    }
    res.status(200).json({ id: doc.id, ...data })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Actualizar
app.put('/api/data/:collection/:id', requireAuth, async (req, res) => {
  try {
    const { collection, id } = req.params
    const ref = db.collection(collection).doc(id)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).json({ error: 'No encontrado' })
    const data = doc.data()
    if (req.user.role !== 'admin' && data.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Sin permisos' })
    }
    const updates = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    await ref.update(updates)
    res.status(200).json({ id, ...updates })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Eliminar
app.delete('/api/data/:collection/:id', requireAuth, async (req, res) => {
  try {
    const { collection, id } = req.params
    const ref = db.collection(collection).doc(id)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).json({ error: 'No encontrado' })
    const data = doc.data()
    if (req.user.role !== 'admin' && data.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Sin permisos' })
    }
    await ref.delete()
    res.status(200).json({ id, deleted: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Exportar HTTP Function
exports.api = functions.https.onRequest(app)