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
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
const publicPaymentRoutes = require('./routes/public-payments');
const notificationRoutes = require('./routes/notifications');
const serviceRoutes = require('./routes/services');
const diagnosticsRoutes = require('./routes/diagnostics');
const adminRoutes = require('./routes/admin');

// Crear aplicación Express
const app = express();
// Configurar trust proxy para Nginx (1 = confiar en el primer proxy)
app.set('trust proxy', 1);
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      const defaultOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://localhost:3000',
        'https://localhost:5173',
        'https://localhost:5174',
        'https://verificandoando.com.mx',
        'https://www.verificandoando.com.mx'
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
        logger.warn(`Socket.IO CORS: Origen no permitido: ${origin}`);
        callback(null, true); // Permitir de todas formas para evitar problemas
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
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
      'http://localhost:5174', // Puerto actual del frontend
      'https://localhost:3000',
      'https://localhost:5173',
      'https://localhost:5174' // Puerto actual del frontend
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

// Rate limiting - Configuración más permisiva
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // 500 requests por IP cada 15 minutos
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false } // Desactivar validación de trust proxy
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 intentos de auth por IP cada 15 minutos
  message: {
    error: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false } // Desactivar validación de trust proxy
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

// Alias de health para clientes que esperan /api/health
app.get('/api/health', (req, res) => {
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
app.use('/api/public-payments', publicPaymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/admin', adminRoutes);

// Ruta para servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  const indexPath = path.join(distPath, 'index.html');
  const serveFrontend = process.env.SERVE_FRONTEND !== 'false';

  if (serveFrontend && fs.existsSync(indexPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    logger.info('Frontend dist no encontrado o deshabilitado; sirviendo solo API.');
  }
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

// Configuración de eventos Socket.IO
const User = require('./models/User');
const Driver = require('./models/Driver');

io.on('connection', (socket) => {
  logger.info(`Cliente conectado: ${socket.id}`);

  // Unirse a sala de usuario
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`Usuario ${userId} se unió a su sala`);
  });

  // Unirse a sala de chofer y marcar como en línea
  socket.on('join-driver-room', async (driverId) => {
    socket.join(`driver-${driverId}`);
    socket.driverId = driverId; // Guardar para usar en disconnect
    logger.info(`Chofer ${driverId} se unió a su sala`);
    
    // Marcar conductor como en línea (buscar en User primero, luego Driver)
    try {
      let updated = await User.findByIdAndUpdate(driverId, { isOnline: true });
      if (!updated) {
        await Driver.findByIdAndUpdate(driverId, { isOnline: true });
      }
      
      // Emitir lista de conductores en línea actualizada
      const onlineUsersDrivers = await User.find({ role: 'driver', isOnline: true }).select('_id name email');
      const onlineDrivers = await Driver.find({ isOnline: true }).select('_id name email');
      io.emit('drivers-online', [...onlineUsersDrivers, ...onlineDrivers]);
      
      logger.info(`Chofer ${driverId} marcado como en línea`);
    } catch (error) {
      logger.error('Error al actualizar estado del conductor:', error);
    }
  });

  // Unirse a sala de cita
  socket.on('join-appointment-room', (appointmentId) => {
    socket.join(`appointment-${appointmentId}`);
    logger.info(`Cliente se unió a sala de cita ${appointmentId}`);
  });

  // Unirse a sala genérica (compatibilidad con frontend)
  socket.on('join-room', (room) => {
    if (typeof room !== 'string') {
      logger.warn(`Intento de unirse a sala inválida: ${typeof room}`);
      return;
    }
    socket.join(room);
    logger.info(`Cliente ${socket.id} se unió a sala ${room}`);
  });

  // Actualización de ubicación del chofer
  socket.on('update-location', (data) => {
    const { driverId, appointmentId, location } = data;
    if (appointmentId) {
      io.to(`appointment-${appointmentId}`).emit('driver-location-updated', {
        driverId,
        location,
        timestamp: new Date()
      });
    }
    logger.info(`Ubicación actualizada para chofer ${driverId}`);
  });

  // Alias para actualización de ubicación
  socket.on('driver-location-update', (data) => {
    const { driverId, appointmentId, location } = data;
    if (appointmentId) {
      io.to(`appointment-${appointmentId}`).emit('driver-location-updated', {
        driverId,
        location,
        timestamp: new Date()
      });
    }
  });

  // Actualización de estado de cita
  socket.on('appointment-status-update', (data) => {
    const { appointmentId, status, location } = data;
    io.to(`appointment-${appointmentId}`).emit('appointment-updated', {
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
    socket.to(`user-${userId}`).emit('new-notification', notification);
    logger.info(`Notificación enviada a usuario ${userId}`);
  });

  // Desconexión
  socket.on('disconnect', async () => {
    logger.info(`Cliente desconectado: ${socket.id}`);
    
    // Si era un conductor, marcar como fuera de línea
    try {
      const driverId = socket.driverId;
      if (driverId) {
        let updated = await User.findByIdAndUpdate(driverId, { isOnline: false });
        if (!updated) {
          await Driver.findByIdAndUpdate(driverId, { isOnline: false });
        }
        
        const onlineUsersDrivers = await User.find({ role: 'driver', isOnline: true }).select('_id name email');
        const onlineDrivers = await Driver.find({ isOnline: true }).select('_id name email');
        io.emit('drivers-online', [...onlineUsersDrivers, ...onlineDrivers]);
        
        logger.info(`Chofer ${driverId} marcado como fuera de línea`);
      }
    } catch (error) {
      logger.error('Error al actualizar estado del conductor al desconectar:', error);
    }
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
    
    // Auto-seed en desarrollo si la base de datos está vacía (común con in-memory)
    if (process.env.NODE_ENV === 'development') {
      try {
        const User = require('./models/User');
        const Service = require('./models/Service');
        const userCount = await User.countDocuments();
        const serviceCount = await Service.countDocuments();
        
        if (userCount === 0) {
          logger.info('🌱 Base de datos vacía detectada en desarrollo. Ejecutando seed automático...');
          const { createUsers, createDrivers, createCars } = require('./scripts/seed');
          const users = await createUsers();
          const drivers = await createDrivers();
          const cars = await createCars(users);
          
          if (users.length > 0 && drivers.length > 0) {
              logger.info('✅ Seed automático completado: Usuarios y Choferes creados.');
              logger.info('   👤 Cliente: juan@example.com / password123');
              logger.info('   🚗 Chofer: roberto@example.com / driver123');
              if (cars.length > 0) {
                  logger.info(`   🚙 Auto creado para Juan: ${cars[0].plates}`);
              }
          }
        }
        
        // Seed de servicios si no existen
        if (serviceCount === 0) {
          logger.info('🔧 Creando servicios...');
          const { services } = require('./scripts/seedServices');
          const createdServices = await Service.insertMany(services);
          logger.info(`✅ ${createdServices.length} servicios creados`);
        }
      } catch (seedError) {
        logger.error('❌ Error en seed automático:', seedError);
      }
    }

    // Hacer io disponible para las rutas
//     app.set('io', io);

    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Servidor corriendo en puerto ${PORT}`);
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
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuando ejecución en producción tras excepción no capturada');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada:', { reason, promise });
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuando ejecución en producción tras promesa rechazada no manejada');
  }
});

// Iniciar servidor si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
