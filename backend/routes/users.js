const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Logging para todas las peticiones a /api/users
router.use((req, res, next) => {
  logger.info(`=== USERS ROUTE: ${req.method} ${req.originalUrl} ===`);
  logger.info(`=== USERS ROUTE: req.userId = ${req.userId}, req.userRole = ${req.userRole} ===`);
  next();
});

// Middleware catch-all para debugging
router.use('*', (req, res, next) => {
  logger.info(`=== USERS CATCH-ALL: ${req.method} ${req.originalUrl} ===`);
  logger.info(`=== USERS CATCH-ALL: req.userId = ${req.userId}, req.userRole = ${req.userRole} ===`);
  next();
});

// Esquemas de validación
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    coordinates: Joi.object({
      lat: Joi.number(),
      lng: Joi.number()
    })
  }),
  preferences: Joi.object({
    notifications: Joi.object({
      push: Joi.boolean(),
      whatsapp: Joi.boolean(),
      email: Joi.boolean()
    }),
    language: Joi.string().valid('es', 'en')
  })
});

// Obtener todos los usuarios (solo admin)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filtros opcionales
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === 'true';
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener configuración del usuario
router.get('/settings', auth, async (req, res) => {
  logger.info('=== SETTINGS ENDPOINT: START ===');
  try {
    logger.info('=== SETTINGS ENDPOINT: INSIDE TRY ===');
    
    // Respuesta simple para depurar
    res.json({ 
      message: 'Settings endpoint working',
      userId: req.userId,
      userRole: req.userRole
    });
    
    logger.info('=== SETTINGS ENDPOINT: RESPONSE SENT ===');
  } catch (error) {
    logger.error('=== SETTINGS ENDPOINT: ERROR ===', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener usuario por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo admin puede ver cualquier usuario, otros solo su propio perfil
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver este usuario' 
      });
    }

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user });

  } catch (error) {
    logger.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar usuario
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo admin puede actualizar cualquier usuario, otros solo su propio perfil
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para actualizar este usuario' 
      });
    }

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    // Verificar si el teléfono ya existe (si se está actualizando)
    if (value.phone) {
      const existingUser = await User.findOne({ 
        phone: value.phone, 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(409).json({ 
          message: 'El teléfono ya está registrado por otro usuario' 
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      value,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    logger.info(`Usuario actualizado: ${user.email} por ${req.user.email}`);

    res.json({
      message: 'Usuario actualizado exitosamente',
      user
    });

  } catch (error) {
    logger.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Desactivar/activar usuario (solo admin)
router.patch('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        message: 'isActive debe ser un valor booleano' 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    logger.info(`Usuario ${isActive ? 'activado' : 'desactivado'}: ${user.email} por ${req.user.email}`);

    res.json({
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      user
    });

  } catch (error) {
    logger.error('Error cambiando estado del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el propio usuario admin
    if (req.userId === id) {
      return res.status(400).json({ 
        message: 'No puedes eliminar tu propia cuenta' 
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el usuario tiene citas activas
    const Appointment = require('../models/Appointment');
    const activeAppointments = await Appointment.countDocuments({
      client: id,
      status: { $in: ['pending', 'assigned', 'driver_enroute', 'picked_up', 'in_verification'] }
    });

    if (activeAppointments > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el usuario porque tiene citas activas' 
      });
    }

    await User.findByIdAndDelete(id);

    logger.info(`Usuario eliminado: ${user.email} por ${req.user.email}`);

    res.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    logger.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de usuarios (solo admin)
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const clientUsers = await User.countDocuments({ role: 'client' });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Usuarios registrados en los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Usuarios por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      overview: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        clients: clientUsers,
        admins: adminUsers,
        recent: recentUsers
      },
      chartData: usersByMonth
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar token FCM para notificaciones push
router.put('/fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'Token FCM requerido' });
    }

    await User.findByIdAndUpdate(req.userId, { fcmToken });

    res.json({ message: 'Token FCM actualizado exitosamente' });

  } catch (error) {
    logger.error('Error actualizando token FCM:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener historial de actividad del usuario
router.get('/:id/activity', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo admin puede ver actividad de cualquier usuario, otros solo la suya
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver esta información' 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Obtener citas del usuario
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ client: id })
      .populate('car', 'brand model year plates')
      .populate('driver', 'name phone rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAppointments = await Appointment.countDocuments({ client: id });

    res.json({
      activity: appointments,
      pagination: {
        page,
        limit,
        total: totalAppointments,
        pages: Math.ceil(totalAppointments / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo actividad del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar configuración del usuario
router.put('/settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar preferencias del usuario
    user.preferences = settings;
    await user.save();

    res.json({ message: 'Configuración actualizada exitosamente', settings: user.preferences });
  } catch (error) {
    logger.error('Error actualizando configuración del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint de prueba público para verificar que el servidor funciona sin auth
router.get('/test-public', async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint /users/test-public llamado');
  res.json({ 
    message: 'Este endpoint funciona sin autenticación', 
    timestamp: new Date(),
    server: 'Backend funcionando correctamente'
  });
});

module.exports = router;