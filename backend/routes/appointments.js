const express = require('express');
const Joi = require('joi');
const Appointment = require('../models/Appointment');
const Driver = require('../models/Driver');
const Car = require('../models/Car');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');
const { mockAppointments } = require('../config/mockDatabase');
const logger = require('../utils/logger');

const router = express.Router();

// Función auxiliar para actualizar estado del driver (busca en User primero, luego Driver)
async function updateDriverAvailability(driverId, isAvailable) {
  if (!driverId) return;
  
  // Intentar actualizar en User primero
  const userResult = await User.findByIdAndUpdate(driverId, { isAvailable });
  if (userResult) return userResult;
  
  // Fallback: actualizar en Driver
  return await Driver.findByIdAndUpdate(driverId, { isAvailable });
}

// Función auxiliar para calcular hora de fin
function calculateEndTime(startTime) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + 1; // Duración de 1 hora por defecto
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Esquemas de validación
const createAppointmentSchema = Joi.object({
  car: Joi.string().required(),
  scheduledDate: Joi.date().required(),
  scheduledTime: Joi.string().required().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  services: Joi.object({
    verification: Joi.boolean().default(true),
    additionalServices: Joi.array().items(
      Joi.object({
        name: Joi.string().valid(
          'wash', 'oil_change', 'spark_plugs', 'brakes', 'air_filter', 
          'tire_check', 'battery_check', 'brake_check', 'transmission', 
          'cooling_system', 'electrical', 'suspension', 'exhaust', 'fuel_system'
        ).required(),
        price: Joi.number().min(0).required()
      })
    ).default([])
  }).required(),
  pickupAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required()
  }).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required()
  }).required(),
  notes: Joi.string().max(500).allow(''),
  preferredDriver: Joi.string().allow(null)
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'assigned', 'driver_enroute', 'picked_up', 
    'in_verification', 'completed', 'delivered', 'cancelled'
  ).required(),
  notes: Joi.string().max(500).allow(''),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180)
  })
});

const ratingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(500).allow('')
});

// Función para encontrar chofer disponible
// Busca en el modelo User donde role === 'driver'
async function findAvailableDriver(pickupCoordinates, preferredDriverId = null) {
  try {
    // Si hay chofer preferido, verificar si está disponible
    if (preferredDriverId) {
      // Buscar primero en User (modelo principal)
      let preferredDriver = await User.findOne({
        _id: preferredDriverId,
        role: 'driver',
        isOnline: true,
        isAvailable: true,
        isVerified: true,
        isActive: true
      });
      
      // Fallback: buscar en Driver (compatibilidad)
      if (!preferredDriver) {
        preferredDriver = await Driver.findOne({
          _id: preferredDriverId,
          isOnline: true,
          isAvailable: true,
          isVerified: true,
          isActive: true
        });
      }
      
      if (preferredDriver) {
        return preferredDriver;
      }
    }

    // Primero buscar en User (modelo principal) con búsqueda geoespacial
    try {
      const availableDrivers = await User.find({
        role: 'driver',
        isOnline: true,
        isAvailable: true,
        isVerified: true,
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [pickupCoordinates.lng, pickupCoordinates.lat]
            },
            $maxDistance: 20000 // 20km máximo
          }
        }
      }).limit(5);

      if (availableDrivers.length > 0) {
        console.log('Driver encontrado en User con geolocalización:', availableDrivers[0].name);
        return availableDrivers[0];
      }
    } catch (geoError) {
      console.warn('Búsqueda geoespacial en User fallida:', geoError.message);
    }

    // Buscar en User sin filtro geoespacial
    let anyAvailableDrivers = await User.find({
      role: 'driver',
      isOnline: true,
      isAvailable: true,
      isVerified: true,
      isActive: true
    }).limit(5);

    // Fallback: buscar en Driver (compatibilidad con datos antiguos)
    if (anyAvailableDrivers.length === 0) {
      anyAvailableDrivers = await Driver.find({
        isOnline: true,
        isAvailable: true,
        isVerified: true,
        isActive: true
      }).limit(5);
    }

    if (anyAvailableDrivers.length === 0) {
      console.log('No hay drivers disponibles en User ni Driver');
      return null;
    }

    // Seleccionar el primer driver disponible
    console.log('Driver asignado sin filtro geoespacial:', anyAvailableDrivers[0].name);
    return anyAvailableDrivers[0];
  } catch (error) {
    console.error('Error finding available driver:', error);
    return null;
  }
}

// Obtener mis citas (ruta específica para usuarios)
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.userRole === 'client') {
      filter.client = req.userId;
    } else if (req.userRole === 'driver') {
      filter.driver = req.userId;
    } else if (req.userRole === 'admin') {
      if (req.query.client) filter.client = req.query.client;
      if (req.query.driver) filter.driver = req.query.driver;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      filter.scheduledDate = { $gte: date, $lt: nextDay };
    }

    const appointments = await Appointment.find(filter)
      .populate('client', 'name email phone')
      .populate('driver', 'name phone vehicleInfo rating')
      .populate('car', 'plates brand model color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo mis citas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener todas las citas
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.userRole === 'client') {
      filter.client = req.userId;
    } else if (req.userRole === 'driver') {
      filter.driver = req.userId;
    } else if (req.userRole === 'admin') {
      if (req.query.client) filter.client = req.query.client;
      if (req.query.driver) filter.driver = req.query.driver;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      filter.scheduledDate = { $gte: date, $lt: nextDay };
    }

    const appointments = await Appointment.find(filter)
      .populate('client', 'name email phone')
      .populate('driver', 'name phone vehicleInfo rating')
      .populate('car', 'plates brand model color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo citas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener cita por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id)
      .populate('client', 'name email phone')
      .populate('driver', 'name phone vehicleInfo rating location')
      .populate('car', 'plates brand model color year')
      .populate('payment');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Verificar permisos
    const hasAccess = req.userRole === 'admin' || 
                     appointment.client._id.toString() === req.userId ||
                     (appointment.driver && appointment.driver._id.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver esta cita' 
      });
    }

    res.json({ appointment });

  } catch (error) {
    logger.error('Error obteniendo cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nueva cita
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = createAppointmentSchema.validate(req.body);
    if (error) {
      logger.error('Error de validación en cita:', { 
        errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })),
        body: req.body 
      });
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    // Verificar que el vehículo pertenece al usuario
    const car = await Car.findOne({ 
      _id: value.car, 
      owner: req.userId,
      isActive: true 
    });
    
    if (!car) {
      return res.status(404).json({ 
        message: 'Vehículo no encontrado o no activo' 
      });
    }

    // Verificar que no hay citas pendientes para el mismo vehículo
    const pendingAppointment = await Appointment.findOne({
      car: value.car,
      status: { $in: ['pending', 'assigned', 'driver_enroute', 'picked_up', 'in_verification'] }
    });

    if (pendingAppointment) {
      return res.status(409).json({ 
        message: 'Ya tienes una cita pendiente para este vehículo' 
      });
    }

    // Mapear scheduledTime a timeSlot y agregar pricing base
    const appointmentData = {
      ...value,
      client: req.userId,
      timeSlot: {
        start: value.scheduledTime,
        end: calculateEndTime(value.scheduledTime) // Función para calcular hora de fin
      },
      pricing: {
        basePrice: 500, // Precio base para verificación
        additionalServicesPrice: 0,
        taxes: 80,
        total: 580
      },
      // Convertir coordenadas al formato GeoJSON
      pickupAddress: {
        ...value.pickupAddress,
        coordinates: {
          type: 'Point',
          coordinates: [value.pickupAddress.coordinates.lng, value.pickupAddress.coordinates.lat] // [longitude, latitude]
        }
      },
      deliveryAddress: {
        ...value.deliveryAddress,
        coordinates: {
          type: 'Point',
          coordinates: [value.deliveryAddress.coordinates.lng, value.deliveryAddress.coordinates.lat] // [longitude, latitude]
        }
      }
    };

    // Remover scheduledTime ya que no existe en el modelo
    delete appointmentData.scheduledTime;

    // Crear la cita
    const appointment = new Appointment(appointmentData);

    // Calcular precio total
    appointment.calculateTotal();
    
    await appointment.save();

    // Buscar chofer disponible
    const driver = await findAvailableDriver(
      value.pickupAddress.coordinates, 
      value.preferredDriver
    );

    if (driver) {
      // Asignar chofer automáticamente
      appointment.driver = driver._id;
      appointment.status = 'assigned';
      appointment.statusHistory.push({
        status: 'assigned',
        timestamp: new Date(),
        notes: 'Chofer asignado automáticamente'
      });

      // Marcar chofer como no disponible
      driver.isAvailable = false;
      await driver.save();

      // Enviar notificación al chofer
      await Notification.create({
        recipient: driver._id,
        recipientModel: 'Driver',
        type: 'new_appointment',
        channel: 'push',
        title: 'Nueva Cita Asignada',
        message: `Tienes una nueva cita para verificación vehicular en ${value.pickupAddress.street}`,
        data: {
          appointmentId: appointment._id,
          appointmentNumber: appointment.appointmentNumber,
          pickupAddress: value.pickupAddress.street,
          scheduledDate: value.scheduledDate,
          priority: 'high'
        }
      });

      logger.info(`Chofer asignado automáticamente: ${driver.email} para cita ${appointment.appointmentNumber}`);
    }

    await appointment.save();
    await appointment.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'driver', select: 'name phone vehicleInfo rating' },
      { path: 'car', select: 'plates brand model color' }
    ]);

    // Emitir evento de socket para nueva cita
    if (req.io) {
      // Notificar al cliente que su cita fue creada
      req.io.to(`user-${req.userId}`).emit('appointment-created', {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: appointment.status,
        timestamp: new Date()
      });
      
      // Si se asignó un chofer, notificarle
      if (driver) {
        req.io.to(`driver-${driver._id}`).emit('appointment-assigned', {
          appointmentId: appointment._id,
          appointmentNumber: appointment.appointmentNumber,
          status: appointment.status,
          pickupAddress: value.pickupAddress,
          timestamp: new Date()
        });
      } else {
        // Emitir a todos los choferes que hay una nueva cita disponible
        req.io.emit('new-appointment-available', {
          appointmentId: appointment._id,
          appointmentNumber: appointment.appointmentNumber,
          pickupAddress: value.pickupAddress,
          timestamp: new Date()
        });
      }
    }

    logger.info(`Cita creada: ${appointment.appointmentNumber} por ${req.user.email}`);

    res.status(201).json({
      message: 'Cita creada exitosamente',
      appointment,
      driverAssigned: !!driver
    });

  } catch (error) {
    logger.error('Error creando cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar estado de cita
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateStatusSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const appointment = await Appointment.findById(id)
      .populate('client', 'name email phone fcmToken')
      .populate('driver', 'name phone');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Verificar permisos para cambiar estado
    const canUpdateStatus = req.userRole === 'admin' || 
                           (appointment.driver && appointment.driver._id.toString() === req.userId);

    if (!canUpdateStatus) {
      return res.status(403).json({ 
        message: 'No tienes permisos para actualizar el estado de esta cita' 
      });
    }

    // Validar transición de estado
    const validTransitions = {
      'pending': ['assigned', 'cancelled'],
      'assigned': ['driver_enroute', 'cancelled'],
      'driver_enroute': ['picked_up', 'cancelled'],
      'picked_up': ['in_verification', 'cancelled'],
      'in_verification': ['completed'],
      'completed': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[appointment.status].includes(value.status)) {
      return res.status(400).json({ 
        message: `No se puede cambiar de ${appointment.status} a ${value.status}` 
      });
    }

    // Actualizar estado
    await appointment.updateStatus(value.status, value.notes || '');

    // Actualizar ubicación del chofer si se proporciona
    if (value.location && appointment.driver) {
      const driver = await Driver.findById(appointment.driver._id);
      if (driver) {
        await driver.updateLocation(value.location.lat, value.location.lng);
      }
    }

    // Lógica específica por estado
    if (value.status === 'delivered') {
      // Marcar chofer como disponible nuevamente
      if (appointment.driver) {
        await updateDriverAvailability(appointment.driver._id, true);
      }
    }

    if (value.status === 'cancelled') {
      // Marcar chofer como disponible si estaba asignado
      if (appointment.driver) {
        await updateDriverAvailability(appointment.driver._id, true);
      }
    }

    // Enviar notificación al cliente
    const statusMessages = {
      'assigned': 'Tu cita ha sido asignada a un chofer',
      'driver_enroute': 'El chofer está en camino a recoger tu vehículo',
      'picked_up': 'Tu vehículo ha sido recogido',
      'in_verification': 'Tu vehículo está siendo verificado',
      'completed': 'La verificación de tu vehículo ha sido completada',
      'delivered': 'Tu vehículo ha sido entregado',
      'cancelled': 'Tu cita ha sido cancelada'
    };

    await Notification.create({
      recipient: appointment.client._id,
      recipientModel: 'User',
      type: 'appointment_status',
      channel: 'push',
      title: 'Actualización de Cita',
      message: statusMessages[value.status],
      data: {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: value.status,
        priority: 'normal'
      }
    });

    // Emitir evento de socket para actualización en tiempo real
    if (req.io) {
      // Notificar al cliente
      req.io.to(`user-${appointment.client._id}`).emit('appointment-updated', {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: value.status,
        timestamp: new Date()
      });
      
      // Notificar al chofer si está asignado
      if (appointment.driver) {
        req.io.to(`driver-${appointment.driver._id || appointment.driver}`).emit('appointment-updated', {
          appointmentId: appointment._id,
          appointmentNumber: appointment.appointmentNumber,
          status: value.status,
          timestamp: new Date()
        });
      }
      
      // Emitir a la sala de la cita
      req.io.to(`appointment-${appointment._id}`).emit('appointment-updated', {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: value.status,
        timestamp: new Date()
      });
    }

    logger.info(`Estado de cita actualizado: ${appointment.appointmentNumber} a ${value.status} por ${req.user.email}`);

    res.json({
      message: 'Estado actualizado exitosamente',
      appointment: {
        id: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: appointment.status,
        statusHistory: appointment.statusHistory
      }
    });

  } catch (error) {
    logger.error('Error actualizando estado de cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Asignar chofer manualmente (admin)
router.put('/:id/assign-driver', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ message: 'ID del chofer es requerido' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Solo se pueden asignar choferes a citas pendientes' 
      });
    }

    const driver = await Driver.findOne({
      _id: driverId,
      isVerified: true,
      isActive: true
    });

    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado o no disponible' });
    }

    // Liberar chofer anterior si existía
    if (appointment.driver) {
      await updateDriverAvailability(appointment.driver, true);
    }

    // Asignar nuevo chofer
    appointment.driver = driverId;
    appointment.status = 'assigned';
    appointment.statusHistory.push({
      status: 'assigned',
      timestamp: new Date(),
      notes: `Chofer asignado manualmente por ${req.user.name}`
    });

    driver.isAvailable = false;
    await driver.save();
    await appointment.save();

    // Enviar notificación al chofer
    await Notification.create({
      recipient: driverId,
      recipientModel: 'Driver',
      type: 'new_appointment',
      channel: 'push',
      title: 'Nueva Cita Asignada',
      message: `Se te ha asignado una nueva cita para verificación vehicular`,
      data: {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        priority: 'high'
      }
    });

    // Socket.IO removed - real-time updates disabled

    logger.info(`Chofer asignado manualmente: ${driver.email} para cita ${appointment.appointmentNumber} por ${req.user.email}`);

    res.json({
      message: 'Chofer asignado exitosamente',
      appointment: {
        id: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        driver: {
          id: driver._id,
          name: driver.name,
          phone: driver.phone
        }
      }
    });

  } catch (error) {
    logger.error('Error asignando chofer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cancelar cita
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id)
      .populate('client', 'name email')
      .populate('driver', 'name email');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Verificar permisos
    const canCancel = req.userRole === 'admin' || 
                     appointment.client._id.toString() === req.userId ||
                     (appointment.driver && appointment.driver._id.toString() === req.userId);

    if (!canCancel) {
      return res.status(403).json({ 
        message: 'No tienes permisos para cancelar esta cita' 
      });
    }

    // Verificar si se puede cancelar
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Esta cita no puede ser cancelada en su estado actual' 
      });
    }

    // Cancelar cita
    appointment.status = 'cancelled';
    appointment.cancellation = {
      reason: reason || 'No especificado',
      cancelledBy: req.userId,
      cancelledAt: new Date()
    };

    appointment.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      notes: `Cancelada por ${req.user.name}. Motivo: ${reason || 'No especificado'}`
    });

    // Liberar chofer si estaba asignado
    if (appointment.driver) {
      await updateDriverAvailability(appointment.driver._id, true);

      // Notificar al chofer
      await Notification.create({
        recipient: appointment.driver._id,
        recipientModel: 'Driver',
        type: 'appointment_cancelled',
        channel: 'push',
        title: 'Cita Cancelada',
        message: `La cita ${appointment.appointmentNumber} ha sido cancelada`,
        data: {
          appointmentId: appointment._id,
          appointmentNumber: appointment.appointmentNumber,
          reason: reason || 'No especificado'
        }
      });
    }

    // Notificar al cliente si no fue quien canceló
    if (req.userId !== appointment.client._id.toString()) {
      await Notification.create({
        recipient: appointment.client._id,
        recipientModel: 'User',
        type: 'appointment_cancelled',
        channel: 'push',
        title: 'Cita Cancelada',
        message: `Tu cita ${appointment.appointmentNumber} ha sido cancelada`,
        data: {
          appointmentId: appointment._id,
          appointmentNumber: appointment.appointmentNumber,
          reason: reason || 'No especificado'
        }
      });
    }

    await appointment.save();

    // Socket.IO removed - real-time updates disabled

    logger.info(`Cita cancelada: ${appointment.appointmentNumber} por ${req.user.email}`);

    res.json({
      message: 'Cita cancelada exitosamente',
      appointment: {
        id: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: appointment.status,
        cancellation: appointment.cancellation
      }
    });

  } catch (error) {
    logger.error('Error cancelando cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Calificar servicio
router.post('/:id/rating', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = ratingSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const appointment = await Appointment.findById(id)
      .populate('driver', 'name email rating totalRatings');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Solo el cliente puede calificar
    if (appointment.client.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'Solo el cliente puede calificar el servicio' 
      });
    }

    // Solo se puede calificar si está entregada
    if (appointment.status !== 'delivered') {
      return res.status(400).json({ 
        message: 'Solo se pueden calificar servicios completados' 
      });
    }

    // Verificar si ya fue calificada
    if (appointment.clientRating) {
      return res.status(400).json({ 
        message: 'Esta cita ya ha sido calificada' 
      });
    }

    // Agregar calificación
    appointment.clientRating = {
      rating: value.rating,
      comment: value.comment || '',
      ratedAt: new Date()
    };

    await appointment.save();

    // Actualizar rating del chofer
    if (appointment.driver) {
      const driver = await Driver.findById(appointment.driver._id);
      if (driver) {
        await driver.updateRating(value.rating);
      }
    }

    logger.info(`Cita calificada: ${appointment.appointmentNumber} con ${value.rating} estrellas por ${req.user.email}`);

    res.json({
      message: 'Calificación enviada exitosamente',
      rating: appointment.clientRating
    });

  } catch (error) {
    logger.error('Error calificando cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener citas disponibles para chofer
router.get('/driver/available', auth, async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        message: 'Solo los choferes pueden ver citas disponibles' 
      });
    }

    // Buscar driver en User primero, luego en Driver
    let driver = await User.findById(req.userId);
    if (!driver || driver.role !== 'driver') {
      driver = await Driver.findById(req.userId);
    }
    
    if (!driver) {
      return res.json({ appointments: [] });
    }

    // Obtener todas las citas pendientes (sin asignar)
    const appointments = await Appointment.find({
      status: 'pending',
      driver: null // Solo citas sin chofer asignado
    })
    .populate('client', 'name phone')
    .populate('car', 'plates brand model color')
    .sort({ createdAt: 1 })
    .limit(10);

    // Devolver citas sin cálculo de distancia si no hay ubicación
    const appointmentsWithDistance = appointments.map(appointment => {
      let distance = null;
      try {
        if (appointment.pickupAddress?.coordinates?.coordinates && driver.location?.coordinates) {
          const [lng, lat] = appointment.pickupAddress.coordinates.coordinates;
          const [driverLng, driverLat] = driver.location.coordinates;
          // Cálculo simple de distancia (Haversine simplificado)
          const R = 6371; // km
          const dLat = (lat - driverLat) * Math.PI / 180;
          const dLon = (lng - driverLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(driverLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = Math.round(R * c * 100) / 100;
        }
      } catch (e) {
        // Ignorar errores de cálculo de distancia
      }
      return {
        ...appointment.toJSON(),
        distance
      };
    });

    res.json({ appointments: appointmentsWithDistance });

  } catch (error) {
    logger.error('Error obteniendo citas disponibles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Aceptar cita (chofer)
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        message: 'Solo los choferes pueden aceptar citas' 
      });
    }

    // Buscar driver en User primero, luego en Driver
    let driver = await User.findById(req.userId);
    if (!driver || driver.role !== 'driver') {
      driver = await Driver.findById(req.userId);
    }
    
    if (!driver) {
      return res.status(400).json({ 
        message: 'Chofer no encontrado' 
      });
    }

    const appointment = await Appointment.findById(id)
      .populate('client', 'name email fcmToken');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Esta cita ya no está disponible' 
      });
    }

    // Asignar chofer
    appointment.driver = req.userId;
    appointment.status = 'assigned';
    appointment.statusHistory.push({
      status: 'assigned',
      timestamp: new Date(),
      notes: 'Cita aceptada por el chofer'
    });

    // Marcar driver como no disponible
    await updateDriverAvailability(req.userId, false);
    
    await appointment.save();

    // Notificar al cliente
    await Notification.create({
      recipient: appointment.client._id,
      recipientModel: 'User',
      type: 'appointment_assigned',
      channel: 'push',
      title: 'Chofer Asignado',
      message: `${driver.name} ha aceptado tu cita y está en camino`,
      data: {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        driverName: driver.name,
        driverPhone: driver.phone,
        priority: 'high'
      }
    });

    // Emitir evento de socket para notificar al cliente en tiempo real
    if (req.io) {
      req.io.to(`user-${appointment.client._id}`).emit('appointment-updated', {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: 'assigned',
        driverName: driver.name,
        driverPhone: driver.phone,
        timestamp: new Date()
      });
      
      // Emitir a la sala de la cita
      req.io.to(`appointment-${appointment._id}`).emit('appointment-updated', {
        appointmentId: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: 'assigned',
        timestamp: new Date()
      });
    }

    logger.info(`Cita aceptada: ${appointment.appointmentNumber} por chofer ${driver.email}`);

    res.json({
      message: 'Cita aceptada exitosamente',
      appointment: {
        id: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: appointment.status
      }
    });

  } catch (error) {
    logger.error('Error aceptando cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Marcar servicio extra como completado
router.put('/:id/services/:serviceName/complete', auth, async (req, res) => {
  try {
    const { id, serviceName } = req.params;

    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        message: 'Solo los choferes pueden marcar servicios como completados' 
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.driver.toString() !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso sobre esta cita' });
    }

    const serviceIndex = appointment.services.additionalServices.findIndex(
      s => s.name === serviceName
    );

    if (serviceIndex === -1) {
      return res.status(404).json({ message: 'Servicio no encontrado en esta cita' });
    }

    appointment.services.additionalServices[serviceIndex].completed = true;
    appointment.services.additionalServices[serviceIndex].completedAt = new Date();

    await appointment.save();

    // Notificar al cliente
    await Notification.create({
      recipient: appointment.client,
      recipientModel: 'User',
      type: 'service_completed',
      channel: 'push',
      title: 'Servicio Completado',
      message: `El servicio de ${serviceName} ha sido completado`,
      data: {
        appointmentId: appointment._id,
        serviceName,
        completedAt: new Date()
      }
    });

    res.json({
      message: 'Servicio marcado como completado',
      service: appointment.services.additionalServices[serviceIndex]
    });

  } catch (error) {
    logger.error('Error completando servicio:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agregar evidencia a un servicio
router.post('/:id/services/:serviceName/evidence', auth, async (req, res) => {
  try {
    const { id, serviceName } = req.params;
    const { url, description } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL de evidencia requerida' });
    }

    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        message: 'Solo los choferes pueden agregar evidencia' 
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.driver.toString() !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso sobre esta cita' });
    }

    const serviceIndex = appointment.services.additionalServices.findIndex(
      s => s.name === serviceName
    );

    if (serviceIndex === -1) {
      return res.status(404).json({ message: 'Servicio no encontrado en esta cita' });
    }

    appointment.services.additionalServices[serviceIndex].evidence.push({
      url: url,
      description: description || 'Evidencia fotográfica',
      uploadedAt: new Date()
    });

    await appointment.save();

    res.json({
      message: 'Evidencia agregada exitosamente',
      evidence: appointment.services.additionalServices[serviceIndex].evidence
    });

  } catch (error) {
    logger.error('Error agregando evidencia:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
