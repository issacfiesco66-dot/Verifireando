const express = require('express');
const Joi = require('joi');
const Driver = require('../models/Driver');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');
const { mockDrivers } = require('../config/mockDatabase');
const logger = require('../utils/logger');

const router = express.Router();

// Esquemas de validación
const updateDriverSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/),
  licenseNumber: Joi.string(),
  licenseExpiry: Joi.date(),
  vehicleInfo: Joi.object({
    brand: Joi.string(),
    model: Joi.string(),
    year: Joi.number().min(1990).max(new Date().getFullYear() + 1),
    plates: Joi.string(),
    color: Joi.string(),
    photos: Joi.array().items(Joi.string())
  }),
  workingHours: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    days: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'))
  }),
  bankInfo: Joi.object({
    accountNumber: Joi.string(),
    bankName: Joi.string(),
    accountHolder: Joi.string(),
    clabe: Joi.string()
  })
});

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required()
});

// Obtener todos los choferes (admin) o choferes disponibles (público) - USANDO DATOS MOCK
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Usar datos mock en lugar de MongoDB
    let filteredDrivers = [...mockDrivers];
    
    // Si no es admin, solo mostrar choferes verificados y activos
    if (!req.user || req.userRole !== 'admin') {
      filteredDrivers = filteredDrivers.filter(driver => 
        driver.isVerified === true && 
        driver.isActive === true
      );
    }
    
    // Filtros adicionales para admin
    if (req.user && req.userRole === 'admin') {
      if (req.query.isOnline !== undefined) {
        const isOnline = req.query.isOnline === 'true';
        filteredDrivers = filteredDrivers.filter(driver => driver.isOnline === isOnline);
      }
      
      if (req.query.isAvailable !== undefined) {
        const isAvailable = req.query.isAvailable === 'true';
        filteredDrivers = filteredDrivers.filter(driver => driver.isAvailable === isAvailable);
      }
    }
    
    // Filtro de búsqueda
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredDrivers = filteredDrivers.filter(driver => 
        driver.name.toLowerCase().includes(searchTerm) ||
        driver.email.toLowerCase().includes(searchTerm) ||
        driver.licenseNumber.toLowerCase().includes(searchTerm) ||
        (driver.vehicleInfo && driver.vehicleInfo.plates && driver.vehicleInfo.plates.toLowerCase().includes(searchTerm))
      );
    }

    // Aplicar paginación
    const total = filteredDrivers.length;
    const drivers = filteredDrivers
      .slice(skip, skip + limit)
      .map(driver => {
        // Remover información sensible
        const { password, bankInfo, ...safeDriver } = driver;
        return safeDriver;
      });

    res.json({
      drivers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo choferes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del chofer actual (autenticado)
router.get('/stats', auth, authorize(['driver']), async (req, res) => {
  try {
    const driver = await Driver.findById(req.userId);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    // Estadísticas de citas
    const totalAppointments = await Appointment.countDocuments({ driver: req.userId });
    const completedAppointments = await Appointment.countDocuments({ 
      driver: req.userId, 
      status: 'delivered' 
    });
    const cancelledAppointments = await Appointment.countDocuments({ 
      driver: req.userId, 
      status: 'cancelled' 
    });

    // Citas del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyAppointments = await Appointment.countDocuments({
      driver: req.userId,
      createdAt: { $gte: startOfMonth }
    });

    // Ganancias del mes
    const monthlyEarnings = await Appointment.aggregate([
      {
        $match: {
          driver: driver._id,
          status: 'delivered',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);

    res.json({
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      monthlyAppointments,
      monthlyEarnings: monthlyEarnings[0]?.total || 0,
      rating: typeof driver.rating === 'object' ? (driver.rating.average || 0) : (driver.rating || 0),
      totalRatings: typeof driver.rating === 'object' ? (driver.rating.count || 0) : (driver.totalRatings || 0)
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas del chofer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener información del vehículo del chofer actual
router.get('/vehicle', auth, authorize(['driver']), async (req, res) => {
  try {
    const driver = await Driver.findById(req.userId).select('vehicleInfo');
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    res.json(driver.vehicleInfo || {});

  } catch (error) {
    logger.error('Error obteniendo información del vehículo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar información del vehículo del chofer actual
router.put('/vehicle', auth, authorize(['driver']), async (req, res) => {
  try {
    const { brand, model, year, plates, color, photos } = req.body;

    const driver = await Driver.findById(req.userId);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    driver.vehicleInfo = {
      brand: brand || driver.vehicleInfo?.brand,
      model: model || driver.vehicleInfo?.model,
      year: year || driver.vehicleInfo?.year,
      plates: plates || driver.vehicleInfo?.plates,
      color: color || driver.vehicleInfo?.color,
      photos: photos || driver.vehicleInfo?.photos || []
    };

    await driver.save();

    res.json({
      message: 'Información del vehículo actualizada exitosamente',
      vehicleInfo: driver.vehicleInfo
    });

  } catch (error) {
    logger.error('Error actualizando información del vehículo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener chofer por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let selectFields = '-password -bankInfo';
    
    // Solo el propio chofer o admin pueden ver información completa
    if (req.user && (req.userId === id || req.userRole === 'admin')) {
      selectFields = '-password';
    }

    const driver = await Driver.findById(id).select(selectFields);
    
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    // Si no es admin ni el propio chofer, solo mostrar si está verificado
    if (!req.user || (req.userId !== id && req.userRole !== 'admin')) {
      if (!driver.isVerified || !driver.isActive) {
        return res.status(404).json({ message: 'Chofer no encontrado' });
      }
    }

    res.json({ driver });

  } catch (error) {
    logger.error('Error obteniendo chofer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar perfil de chofer
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo el propio chofer o admin pueden actualizar
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para actualizar este chofer' 
      });
    }

    const { error, value } = updateDriverSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    // Verificar si las placas ya existen (si se están actualizando)
    if (value.vehicleInfo?.plates) {
      const existingDriver = await Driver.findOne({ 
        'vehicleInfo.plates': value.vehicleInfo.plates, 
        _id: { $ne: id } 
      });
      
      if (existingDriver) {
        return res.status(409).json({ 
          message: 'Las placas ya están registradas por otro chofer' 
        });
      }
    }

    // Si se actualiza información crítica, marcar para re-verificación
    const criticalFields = ['licenseNumber', 'vehicleInfo.plates'];
    const needsReVerification = criticalFields.some(field => {
      const fieldParts = field.split('.');
      if (fieldParts.length === 1) {
        return value[fieldParts[0]] !== undefined;
      } else {
        return value[fieldParts[0]]?.[fieldParts[1]] !== undefined;
      }
    });

    if (needsReVerification && req.userRole !== 'admin') {
      value.verificationStatus = 'pending';
      value.isVerified = false;
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      value,
      { new: true, runValidators: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    logger.info(`Chofer actualizado: ${driver.email} por ${req.user.email}`);

    res.json({
      message: 'Chofer actualizado exitosamente',
      driver,
      ...(needsReVerification && { 
        warning: 'Los cambios requieren re-verificación por parte del administrador' 
      })
    });

  } catch (error) {
    logger.error('Error actualizando chofer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar ubicación del chofer
router.put('/:id/location', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo el propio chofer puede actualizar su ubicación
    if (req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para actualizar esta ubicación' 
      });
    }

    const { error, value } = locationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Coordenadas inválidas', 
        errors: error.details.map(d => d.message) 
      });
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    await driver.updateLocation(value.lat, value.lng);

    // Emitir actualización de ubicación via Socket.IO si hay citas activas
    const activeAppointments = await Appointment.find({
      driver: id,
      status: { $in: ['assigned', 'driver_enroute', 'picked_up'] }
    });

    activeAppointments.forEach(appointment => {
      req.io.to(`appointment-${appointment._id.toString()}`).emit('location-update', {
        driverId: id,
        location: {
          lat: value.lat,
          lng: value.lng
        },
        timestamp: new Date()
      });
    });

    res.json({ 
      message: 'Ubicación actualizada exitosamente',
      location: {
        lat: value.lat,
        lng: value.lng
      }
    });

  } catch (error) {
    logger.error('Error actualizando ubicación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cambiar estado online/offline
router.put('/:id/online-status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;
    
    // Solo el propio chofer puede cambiar su estado
    if (req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para cambiar este estado' 
      });
    }

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ 
        message: 'isOnline debe ser un valor booleano' 
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      { 
        isOnline,
        // Si se desconecta, también marcar como no disponible
        ...(isOnline === false && { isAvailable: false })
      },
      { new: true }
    ).select('-password -bankInfo');

    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    logger.info(`Chofer ${isOnline ? 'conectado' : 'desconectado'}: ${driver.email}`);

    res.json({
      message: `Estado actualizado a ${isOnline ? 'conectado' : 'desconectado'}`,
      driver: {
        id: driver._id,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable
      }
    });

  } catch (error) {
    logger.error('Error cambiando estado online:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cambiar disponibilidad
router.put('/:id/availability', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    
    // Solo el propio chofer puede cambiar su disponibilidad
    if (req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para cambiar esta disponibilidad' 
      });
    }

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ 
        message: 'isAvailable debe ser un valor booleano' 
      });
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    // No puede estar disponible si no está online
    if (isAvailable && !driver.isOnline) {
      return res.status(400).json({ 
        message: 'Debes estar conectado para estar disponible' 
      });
    }

    driver.isAvailable = isAvailable;
    await driver.save();

    res.json({
      message: `Disponibilidad actualizada a ${isAvailable ? 'disponible' : 'no disponible'}`,
      driver: {
        id: driver._id,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable
      }
    });

  } catch (error) {
    logger.error('Error cambiando disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar/rechazar chofer (solo admin)
router.put('/:id/verification', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Estado debe ser "approved" o "rejected"' 
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      {
        verificationStatus: status,
        isVerified: status === 'approved',
        verificationNotes: notes || '',
        ...(status === 'approved' && { isActive: true })
      },
      { new: true }
    ).select('-password -bankInfo');

    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    // Enviar notificación al chofer
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: driver._id,
      recipientModel: 'Driver',
      type: status === 'approved' ? 'verification_approved' : 'verification_rejected',
      channel: 'push',
      title: status === 'approved' ? 'Verificación Aprobada' : 'Verificación Rechazada',
      message: status === 'approved' 
        ? 'Tu cuenta ha sido verificada exitosamente. Ya puedes recibir solicitudes.'
        : `Tu verificación fue rechazada. Motivo: ${notes || 'No especificado'}`,
      data: {
        priority: 'high'
      }
    });

    logger.info(`Chofer ${status === 'approved' ? 'aprobado' : 'rechazado'}: ${driver.email} por ${req.user.email}`);

    res.json({
      message: `Chofer ${status === 'approved' ? 'aprobado' : 'rechazado'} exitosamente`,
      driver
    });

  } catch (error) {
    logger.error('Error en verificación de chofer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de chofer
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo el propio chofer o admin pueden ver estadísticas
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver estas estadísticas' 
      });
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    // Estadísticas de citas
    const totalAppointments = await Appointment.countDocuments({ driver: id });
    const completedAppointments = await Appointment.countDocuments({ 
      driver: id, 
      status: 'delivered' 
    });
    const cancelledAppointments = await Appointment.countDocuments({ 
      driver: id, 
      status: 'cancelled' 
    });

    // Citas del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyAppointments = await Appointment.countDocuments({
      driver: id,
      createdAt: { $gte: startOfMonth }
    });

    // Ganancias del mes
    const monthlyEarnings = await Appointment.aggregate([
      {
        $match: {
          driver: driver._id,
          status: 'delivered',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'payment',
          foreignField: '_id',
          as: 'paymentInfo'
        }
      },
      {
        $unwind: '$paymentInfo'
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentInfo.fees.driverEarnings' }
        }
      }
    ]);

    const monthlyEarningsTotal = monthlyEarnings[0]?.total || 0;

    res.json({
      stats: {
        total: totalAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments * 100).toFixed(1) : 0,
        rating: driver.rating?.average || 0,
        monthlyAppointments,
        monthlyEarnings: monthlyEarningsTotal,
        totalEarnings: driver.earnings?.total || 0
      }
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de chofer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Buscar choferes disponibles cerca de una ubicación
router.post('/search-nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ 
        message: 'Latitud y longitud son requeridas' 
      });
    }

    const drivers = await Driver.find({
      isOnline: true,
      isAvailable: true,
      isVerified: true,
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000 // convertir km a metros
        }
      }
    })
    .select('name phone vehicleInfo rating location lastLocationUpdate')
    .limit(10);

    // Calcular distancia para cada chofer
    const driversWithDistance = drivers.map(driver => {
      const distance = driver.distanceTo(lat, lng);
      return {
        ...driver.toJSON(),
        distance: Math.round(distance * 100) / 100 // redondear a 2 decimales
      };
    });

    res.json({
      drivers: driversWithDistance,
      searchParams: { lat, lng, radius }
    });

  } catch (error) {
    logger.error('Error buscando choferes cercanos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
