const express = require('express');
const Joi = require('joi');
const Appointment = require('../models/Appointment');
const Driver = require('../models/Driver');
const Car = require('../models/Car');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth-mock');
const logger = require('../utils/logger');

const router = express.Router();

// Esquemas de validación
const createAppointmentSchema = Joi.object({
  car: Joi.string().required(),
  scheduledDate: Joi.date().required().min('now'),
  scheduledTime: Joi.string().required().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  services: Joi.object({
    verification: Joi.boolean().default(true),
    additionalServices: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('wash', 'oil_change', 'tire_check', 'battery_check').required(),
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
async function findAvailableDriver(pickupCoordinates, preferredDriverId = null) {
  try {
    // Si hay chofer preferido, verificar si está disponible
    if (preferredDriverId) {
      const preferredDriver = await Driver.findOne({
        _id: preferredDriverId,
        isOnline: true,
        isAvailable: true,
        isVerified: true,
        isActive: true
      });
      
      if (preferredDriver) {
        return preferredDriver;
      }
    }

    // Buscar choferes disponibles cerca de la ubicación
    const availableDrivers = await Driver.find({
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

    if (availableDrivers.length === 0) {
      return null;
    }

    // Seleccionar el chofer con mejor rating y más cercano
    const driversWithDistance = availableDrivers.map(driver => ({
      driver,
      distance: driver.distanceTo(pickupCoordinates.lat, pickupCoordinates.lng)
    }));

    driversWithDistance.sort((a, b) => {
      // Priorizar por rating, luego por distancia
      if (Math.abs(a.driver.rating - b.driver.rating) > 0.5) {
        return b.driver.rating - a.driver.rating;
      }
      return a.distance - b.distance;
    });

    return driversWithDistance[0].driver;
  } catch (error) {
    logger.error('Error buscando chofer disponible:', error);
    return null;
  }
}

// Obtener todas las citas
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Filtrar por rol
    if (req.userRole === 'client') {
      filter.client = req.userId;
    } else if (req.userRole === 'driver') {
      filter.driver = req.userId;
    }
    // Admin ve todas las citas
    
    // Filtros adicionales
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      filter.scheduledDate = {
        $gte: date,
        $lt: nextDay
      };
    }
    
    if (req.query.driver && req.userRole === 'admin') {
      filter.driver = req.query.driver;
    }
    
    if (req.query.client && req.userRole === 'admin') {
      filter.client = req.query.client;
    }

    const appointments = await Appointment.find(filter)
      .populate('client', 'name email phone')
      .populate('driver', 'name phone vehicleInfo rating')
      .populate('car', 'plates brand model color')
      .populate('payment')
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

    // Crear la cita
    const appointment = new Appointment({
      ...value,
      client: req.userId
    });

    // Calcular precio total
    appointment.calculateTotalPrice();
    
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

    // Emitir evento de nueva cita
    req.io.emit('new-appointment', {
      appointment: appointment.toJSON(),
      timestamp: new Date()
    });

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
        await Driver.findByIdAndUpdate(appointment.driver._id, {
          isAvailable: true
        });
      }
    }

    if (value.status === 'cancelled') {
      // Marcar chofer como disponible si estaba asignado
      if (appointment.driver) {
        await Driver.findByIdAndUpdate(appointment.driver._id, {
          isAvailable: true
        });
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

    // Emitir actualización en tiempo real
    req.io.to(appointment._id.toString()).emit('status-update', {
      appointmentId: appointment._id,
      status: value.status,
      notes: value.notes,
      timestamp: new Date(),
      ...(value.location && { driverLocation: value.location })
    });

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
      await Driver.findByIdAndUpdate(appointment.driver, {
        isAvailable: true
      });
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
      await Driver.findByIdAndUpdate(appointment.driver._id, {
        isAvailable: true
      });

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

    const driver = await Driver.findById(req.userId);
    if (!driver || !driver.isOnline || !driver.isAvailable) {
      return res.json({ appointments: [] });
    }

    // Buscar citas pendientes cerca del chofer
    const radius = 20000; // 20km
    const appointments = await Appointment.find({
      status: 'pending',
      'pickupAddress.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [driver.location.coordinates[0], driver.location.coordinates[1]]
          },
          $maxDistance: radius
        }
      }
    })
    .populate('client', 'name phone')
    .populate('car', 'plates brand model color')
    .sort({ createdAt: 1 })
    .limit(10);

    // Calcular distancia para cada cita
    const appointmentsWithDistance = appointments.map(appointment => {
      const distance = driver.distanceTo(
        appointment.pickupAddress.coordinates.lat,
        appointment.pickupAddress.coordinates.lng
      );
      
      return {
        ...appointment.toJSON(),
        distance: Math.round(distance * 100) / 100
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

    const driver = await Driver.findById(req.userId);
    if (!driver || !driver.isOnline || !driver.isAvailable) {
      return res.status(400).json({ 
        message: 'Debes estar conectado y disponible para aceptar citas' 
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

    driver.isAvailable = false;
    
    await appointment.save();
    await driver.save();

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

module.exports = router;