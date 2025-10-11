const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Importar utilidades
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { mockMongoose } = require('./config/mockDatabase');

// Importar rutas
const authRoutes = require('./routes/auth'); // Usando MongoDB Atlas
const userRoutes = require('./routes/users');
const driverRoutes = require('./routes/drivers');
const carRoutes = require('./routes/cars');
const appointmentRoutes = require('./routes/appointments');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Usar la misma lógica de CORS que el resto de la aplicación
      const defaultOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://localhost:3000',
        'https://localhost:5173'
      ];
      
      const envOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : [];
      
      const frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl) {
        envOrigins.push(frontendUrl);
      }
      
      const allowedOrigins = [...defaultOrigins, ...envOrigins];
      
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS en Socket.IO'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Hacer io disponible globalmente
app.set('io', io);

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Dominios permitidos por defecto
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'https://localhost:3000',
      'https://localhost:5173'
    ];
    
    // Obtener dominios adicionales desde variables de entorno
    const envOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [];
    
    // Frontend URL principal
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      envOrigins.push(frontendUrl);
    }
    
    // Combinar todos los dominios permitidos
    const allowedOrigins = [...defaultOrigins, ...envOrigins];
    
    // En desarrollo, permitir todos los orígenes
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Origen no permitido: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  }
}));

app.use(cors(corsOptions));
app.use(compression());

// Rate limiting - Configuración más permisiva para desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests en desarrollo, 100 en producción
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 50 intentos en desarrollo, 5 en producción
  message: {
    error: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// Middleware de logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para agregar io a req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta para servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Error de validación',
      errors
    });
  }

  // Error de cast de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'ID inválido',
      field: err.path
    });
  }

  // Error de duplicado de MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field} ya existe`,
      field
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expirado'
    });
  }

  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      message: 'Acceso denegado por CORS'
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  logger.info(`Cliente conectado: ${socket.id}`);

  // Unirse a sala de usuario
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`Usuario ${userId} se unió a su sala`);
  });

  // Unirse a sala de chofer
  socket.on('join-driver-room', (driverId) => {
    socket.join(`driver-${driverId}`);
    logger.info(`Chofer ${driverId} se unió a su sala`);
  });

  // Unirse a sala de cita
  socket.on('join-appointment-room', (appointmentId) => {
    socket.join(`appointment-${appointmentId}`);
    logger.info(`Cliente se unió a sala de cita ${appointmentId}`);
  });

  // Actualización de ubicación del chofer
  socket.on('driver-location-update', (data) => {
    const { driverId, appointmentId, location } = data;
    
    // Emitir a la sala de la cita
    if (appointmentId) {
      socket.to(`appointment-${appointmentId}`).emit('driver-location-updated', {
        driverId,
        location,
        timestamp: new Date()
      });
    }
    
    logger.info(`Ubicación actualizada para chofer ${driverId}`);
  });

  // Actualización de estado de cita
  socket.on('appointment-status-update', (data) => {
    const { appointmentId, status, location } = data;
    
    // Emitir a todos en la sala de la cita
    io.to(`appointment-${appointmentId}`).emit('appointment-status-updated', {
      appointmentId,
      status,
      location,
      timestamp: new Date()
    });
    
    logger.info(`Estado de cita ${appointmentId} actualizado a ${status}`);
  });

  // Notificación en tiempo real
  socket.on('send-notification', (data) => {
    const { userId, notification } = data;
    
    // Emitir a la sala del usuario
    socket.to(`user-${userId}`).emit('new-notification', notification);
    
    logger.info(`Notificación enviada a usuario ${userId}`);
  });

  // Desconexión
  socket.on('disconnect', () => {
    logger.info(`Cliente desconectado: ${socket.id}`);
  });

  // Manejo de errores de socket
  socket.on('error', (error) => {
    logger.error('Error de socket:', error);
  });
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Conectar a MongoDB Atlas
    const dbConnection = await connectDB();
    
    if (dbConnection) {
      logger.info('✅ Conectado a MongoDB Atlas - Base de datos: verifireando');
    } else {
      logger.warn('⚠️  Iniciando sin conexión a base de datos');
    }
    
    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📖 API Docs: http://localhost:${PORT}/api`);
      }
    });

  } catch (error) {
    logger.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales del sistema
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    mongoose.connection.close(false, () => {
      logger.info('Conexión a MongoDB cerrada');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    mongoose.connection.close(false, () => {
      logger.info('Conexión a MongoDB cerrada');
      process.exit(0);
    });
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada:', { reason, promise });
  process.exit(1);
});

// Iniciar servidor si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };