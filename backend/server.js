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
const notificationRoutes = require('./routes/notifications');

const logger = require('./utils/logger');
const { initializeFirebase } = require('./config/firebase');

const app = express();
const server = createServer(app);
const defaultOrigins = ["http://localhost:3000", "http://localhost:5173"];
const envOriginsRaw = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
const allowedOrigins = envOriginsRaw ? envOriginsRaw.split(',').map(s => s.trim()) : defaultOrigins;

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed for origin: ' + origin));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 1000 : 100 // 1000 en desarrollo, 100 en producción
});
app.use(limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB Atlas - SOLO ATLAS, sin fallback a localhost
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ ERROR: MONGODB_URI no está configurada');
  console.error('Configura la variable de entorno con tu connection string de Atlas');
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

// Socket.IO para tiempo real
io.on('connection', (socket) => {
  logger.info('Usuario conectado:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(`Usuario ${socket.id} se unió a la sala ${room}`);
  });
  
  socket.on('driver-location', (data) => {
    socket.to(data.appointmentId).emit('location-update', data);
  });
  
  socket.on('appointment-status', (data) => {
    socket.to(data.appointmentId).emit('status-update', data);
  });
  
  socket.on('disconnect', () => {
    logger.info('Usuario desconectado:', socket.id);
  });
});

// Hacer io disponible en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = { app, io };