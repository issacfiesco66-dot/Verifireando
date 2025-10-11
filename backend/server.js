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
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana por IP
});
app.use(limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/verifireando', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Conectado a MongoDB');
})
.catch((error) => {
  logger.error('Error conectando a MongoDB:', error);
  process.exit(1);
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