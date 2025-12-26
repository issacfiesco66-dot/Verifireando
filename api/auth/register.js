const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { MongoClient } = require('mongodb');

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

// Esquema de validación
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('client', 'driver').default('client')
});

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Validar datos de entrada
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details[0].message
      });
    }

    const { name, email, phone, password, role } = value;

    // Conectar a la base de datos
    const client = await connectToDatabase();
    const db = client.db('verifireando');
    const usersCollection = db.collection('users');

    // Verificar si el usuario ya existe
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un usuario con este email o teléfono'
      });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        avatar: null,
        preferences: {
          notifications: true,
          language: 'es'
        }
      }
    };

    const result = await usersCollection.insertOne(newUser);

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: result.insertedId,
        email,
        role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Respuesta exitosa (sin incluir la contraseña)
    const userResponse = {
      id: result.insertedId,
      name,
      email,
      phone,
      role,
      isVerified: false,
      isActive: true,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el registro'
    });
  }
}