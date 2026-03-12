const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const driverRoutes = require('./routes/drivers');
const carRoutes = require('./routes/cars');
const appointmentRoutes = require('./routes/appointments');
const paymentRoutes = require('./routes/payments');
const publicPaymentRoutes = require('./routes/public-payments');
const notificationRoutes = require('./routes/notifications');
const serviceRoutes = require('./routes/services');

const logger = require('./utils/logger');
const { initializeFirebase } = require('./config/firebase');

const app = express();
app.set('trust proxy', 1);
const server = createServer(app);
const defaultOrigins = ["http://localhost:3000", "http://localhost:5173"];
const envOriginsRaw = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
const allowedOrigins = envOriginsRaw ? envOriginsRaw.split(',').map(s => s.trim()) : defaultOrigins;
const allowNoOrigin = true; // Permitir siempre: CORS es solo para browsers, no server-side

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, allowNoOrigin);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, true); // Allow all origins for WebSocket
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return allowNoOrigin ? callback(null, true) : callback(new Error('CORS origin requerido'));
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed for origin: ' + origin));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 2000 : 500,
  standardHeaders: true,
  legacyHeaders: false
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB Atlas - SOLO ATLAS, sin fallback a localhost
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri) {
  console.error('❌ ERROR: MONGODB_URI no está configurada');
  console.error('Configura la variable de entorno con tu connection string de Atlas');
  process.exit(1);
}
if (!jwtSecret) {
  console.error('❌ ERROR: JWT_SECRET no está configurada');
  console.error('Configura JWT_SECRET en tu archivo .env');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  logger.info('✅ Conectado a MongoDB Atlas');
  console.log('✅ Conectado a MongoDB Atlas');
})
.catch((error) => {
  logger.error('❌ Error conectando a MongoDB Atlas:', error);
  console.error('❌ Error conectando a MongoDB Atlas:', error.message);
  process.exit(1); // Forzar salida si no hay conexión a Atlas
});

// Inicializar Firebase
initializeFirebase();

// Socket.IO con autenticación JWT o Firebase
const jwt = require('jsonwebtoken');
const { verifyFirebaseIdToken } = require('./config/firebase');
const User = require('./models/User');

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  logger.info(`[SOCKET] Handshake from ${socket.handshake.address}, hasToken=${!!token}`);
  if (!token) {
    logger.warn('[SOCKET] Rejected: no token');
    return next(new Error('Autenticación requerida'));
  }
  // Try JWT first
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id || decoded.userId;
    socket.userRole = decoded.role;
    logger.info(`[SOCKET] JWT auth OK: userId=${socket.userId}`);
    return next();
  } catch (jwtErr) {
    logger.info(`[SOCKET] JWT failed (${jwtErr.message}), trying Firebase...`);
    // Fall back to Firebase ID token
    try {
      const firebaseDecoded = await verifyFirebaseIdToken(token);
      if (!firebaseDecoded) {
        logger.warn('[SOCKET] Firebase returned null');
        return next(new Error('Token inválido'));
      }
      const email = firebaseDecoded.email;
      logger.info(`[SOCKET] Firebase decoded email=${email}`);
      if (email) {
        const user = await User.findOne({ email }).select('_id role');
        if (user) {
          socket.userId = user._id.toString();
          socket.userRole = user.role;
          logger.info(`[SOCKET] Firebase auth OK: userId=${socket.userId}`);
          return next();
        }
        logger.warn(`[SOCKET] User not found for email=${email}`);
      }
      return next(new Error('Usuario no encontrado'));
    } catch (fbErr) {
      logger.warn(`[SOCKET] Firebase error: ${fbErr.message}`);
      return next(new Error('Token inválido'));
    }
  }
});

io.on('connection', (socket) => {
  logger.info(`Usuario conectado: ${socket.id} (${socket.userId})`);
  
  // Auto-join a su propia sala
  socket.join(`user-${socket.userId}`);
  if (socket.userRole === 'driver') {
    socket.join(`driver-${socket.userId}`);
  }
  
  socket.on('join-room', (room) => {
    // Solo permitir unirse a salas de appointment (validar formato)
    if (typeof room === 'string' && room.startsWith('appointment-')) {
      socket.join(room);
    }
  });
  
  socket.on('driver-location', (data) => {
    // Solo drivers pueden emitir ubicación
    if (socket.userRole !== 'driver') return;
    if (!data?.appointmentId) return;
    
    socket.to(`appointment-${data.appointmentId}`).emit('location-update', data);
  });
  
  socket.on('appointment-status', (data) => {
    if (!data?.appointmentId) return;
    socket.to(`appointment-${data.appointmentId}`).emit('status-update', data);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Usuario desconectado: ${socket.id} (${socket.userId})`);
  });
});

// Hacer io disponible en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public-payments', publicPaymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/services', serviceRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Compatibilidad con Render: healthz
app.get('/healthz', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Raíz informativa para evitar 404 en /
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Verifireando Backend', status: 'OK' });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  logger.error('Error no manejado:', error);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = { app, io };