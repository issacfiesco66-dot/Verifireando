const express = require('express');
const Joi = require('joi');
const Car = require('../models/Car');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Esquemas de validación
const createCarSchema = Joi.object({
  plates: Joi.string().required().pattern(/^[A-Z0-9]{6,8}$/),
  brand: Joi.string().required().min(2).max(50),
  model: Joi.string().required().min(1).max(50),
  year: Joi.number().required().min(1990).max(new Date().getFullYear() + 1),
  color: Joi.string().required().min(2).max(30),
  engineType: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid').default('gasoline'),
  documents: Joi.object({
    registration: Joi.object({
      number: Joi.string(),
      expiryDate: Joi.date(),
      photos: Joi.array().items(Joi.string())
    }),
    insurance: Joi.object({
      company: Joi.string(),
      policyNumber: Joi.string(),
      expiryDate: Joi.date(),
      photos: Joi.array().items(Joi.string())
    })
  }),
  photos: Joi.array().items(Joi.string()).max(10),
  metadata: Joi.object({
    vin: Joi.string(),
    engineNumber: Joi.string(),
    notes: Joi.string().max(500)
  })
});

const updateCarSchema = Joi.object({
  brand: Joi.string().min(2).max(50),
  model: Joi.string().min(1).max(50),
  year: Joi.number().min(1990).max(new Date().getFullYear() + 1),
  color: Joi.string().min(2).max(30),
  engineType: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid'),
  documents: Joi.object({
    registration: Joi.object({
      number: Joi.string(),
      expiryDate: Joi.date(),
      photos: Joi.array().items(Joi.string())
    }),
    insurance: Joi.object({
      company: Joi.string(),
      policyNumber: Joi.string(),
      expiryDate: Joi.date(),
      photos: Joi.array().items(Joi.string())
    })
  }),
  photos: Joi.array().items(Joi.string()).max(10),
  metadata: Joi.object({
    vin: Joi.string(),
    engineNumber: Joi.string(),
    notes: Joi.string().max(500)
  })
});

// Handler para obtener mis vehículos
const getMyCarsHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { owner: req.userId };
    
    // Filtro de búsqueda
    if (req.query.search) {
      filter.$or = [
        { plates: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { model: { $regex: req.query.search, $options: 'i' } },
        { color: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filtro por estado activo
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const cars = await Car.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Car.countDocuments(filter);

    res.json({
      cars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo mis vehículos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener mis vehículos (ruta específica para usuarios)
router.get('/my-cars', auth, getMyCarsHandler);

// Alias para obtener mis vehículos (para evitar 404 si frontend usa ruta distinta)
router.get('/my', auth, getMyCarsHandler);

// Obtener todos los vehículos
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Los usuarios normales solo ven sus propios vehículos
    if (req.userRole !== 'admin') {
      filter.owner = req.userId;
    }
    
    // Filtros adicionales para admin
    if (req.userRole === 'admin') {
      if (req.query.owner) {
        filter.owner = req.query.owner;
      }
      
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }
      
      if (req.query.verificationStatus) {
        filter['verificationHistory.status'] = req.query.verificationStatus;
      }
    }
    
    // Filtro de búsqueda
    if (req.query.search) {
      filter.$or = [
        { plates: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { model: { $regex: req.query.search, $options: 'i' } },
        { color: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const cars = await Car.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Car.countDocuments(filter);

    res.json({
      cars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo vehículos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener vehículo por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await Car.findById(id).populate('owner', 'name email phone');
    
    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Solo el propietario o admin pueden ver el vehículo
    if (req.userRole !== 'admin' && car.owner._id.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver este vehículo' 
      });
    }

    res.json({ car });

  } catch (error) {
    logger.error('Error obteniendo vehículo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nuevo vehículo
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = createCarSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    // Verificar si las placas ya existen
    const existingCar = await Car.findOne({ plates: value.plates });
    if (existingCar) {
      return res.status(409).json({ 
        message: 'Ya existe un vehículo registrado con estas placas' 
      });
    }

    // Crear el vehículo
    const car = new Car({
      ...value,
      owner: req.userId
    });

    await car.save();
    await car.populate('owner', 'name email phone');

    logger.info(`Vehículo creado: ${car.plates} por ${req.user.email}`);

    res.status(201).json({
      message: 'Vehículo registrado exitosamente',
      car
    });

  } catch (error) {
    logger.error('Error creando vehículo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar vehículo
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Solo el propietario o admin pueden actualizar
    if (req.userRole !== 'admin' && car.owner.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para actualizar este vehículo' 
      });
    }

    const { error, value } = updateCarSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    // Actualizar el vehículo
    Object.assign(car, value);
    await car.save();
    await car.populate('owner', 'name email phone');

    logger.info(`Vehículo actualizado: ${car.plates} por ${req.user.email}`);

    res.json({
      message: 'Vehículo actualizado exitosamente',
      car
    });

  } catch (error) {
    logger.error('Error actualizando vehículo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Activar/desactivar vehículo
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        message: 'isActive debe ser un valor booleano' 
      });
    }

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Solo el propietario o admin pueden cambiar el estado
    if (req.userRole !== 'admin' && car.owner.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para cambiar el estado de este vehículo' 
      });
    }

    car.isActive = isActive;
    await car.save();

    logger.info(`Vehículo ${isActive ? 'activado' : 'desactivado'}: ${car.plates} por ${req.user.email}`);

    res.json({
      message: `Vehículo ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      car: {
        id: car._id,
        plates: car.plates,
        isActive: car.isActive
      }
    });

  } catch (error) {
    logger.error('Error cambiando estado del vehículo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar vehículo
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Solo el propietario o admin pueden eliminar
    if (req.userRole !== 'admin' && car.owner.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para eliminar este vehículo' 
      });
    }

    // Verificar si tiene citas pendientes o activas
    const Appointment = require('../models/Appointment');
    const activeAppointments = await Appointment.countDocuments({
      car: id,
      status: { $in: ['pending', 'assigned', 'driver_enroute', 'picked_up', 'in_verification'] }
    });

    if (activeAppointments > 0) {
      // Obtener información de las citas para mostrar en el error
      const appointmentsInfo = await Appointment.find({
        car: id,
        status: { $in: ['pending', 'assigned', 'driver_enroute', 'picked_up', 'in_verification'] }
      })
      .select('appointmentNumber status scheduledDate')
      .limit(5);
      
      return res.status(400).json({ 
        message: `No se puede eliminar el vehículo porque tiene ${activeAppointments} cita(s) activa(s)`,
        activeAppointments: activeAppointments,
        appointments: appointmentsInfo.map(apt => ({
          number: apt.appointmentNumber || apt._id,
          status: apt.status,
          date: apt.scheduledDate
        }))
      });
    }

    await Car.findByIdAndDelete(id);

    logger.info(`Vehículo eliminado: ${car.plates} por ${req.user.email}`);

    res.json({ message: 'Vehículo eliminado exitosamente' });

  } catch (error) {
    logger.error('Error eliminando vehículo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agregar verificación al historial
router.post('/:id/verification', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, expiryDate, inspector } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ 
        message: 'Estado debe ser "approved", "rejected" o "pending"' 
      });
    }

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    const verification = {
      date: new Date(),
      result: status,
      notes: notes || '',
      inspector: inspector || req.user.name,
      nextVerificationDue: status === 'approved' ? expiryDate : null
    };

    car.addVerification(verification);
    await car.save();

    // Enviar notificación al propietario
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: car.owner,
      recipientModel: 'User',
      type: 'verification_result',
      channel: 'push',
      title: 'Resultado de Verificación',
      message: status === 'approved' 
        ? `Tu vehículo ${car.plates} ha pasado la verificación exitosamente.`
        : `Tu vehículo ${car.plates} no pasó la verificación. ${notes || ''}`,
      data: {
        carId: car._id,
        plates: car.plates,
        status,
        priority: 'high'
      }
    });

    logger.info(`Verificación agregada al vehículo ${car.plates}: ${status} por ${req.user.email}`);

    res.json({
      message: 'Verificación agregada exitosamente',
      verification
    });

  } catch (error) {
    logger.error('Error agregando verificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener historial de verificaciones
router.get('/:id/verification-history', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Solo el propietario o admin pueden ver el historial
    if (req.userRole !== 'admin' && car.owner.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver este historial' 
      });
    }

    res.json({
      car: {
        id: car._id,
        plates: car.plates,
        brand: car.brand,
        model: car.model
      },
      verificationHistory: car.verificationHistory,
      currentStatus: car.getVerificationStatus(),
      daysUntilDue: car.getDaysUntilDue()
    });

  } catch (error) {
    logger.error('Error obteniendo historial de verificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener vehículos que necesitan verificación pronto
router.get('/admin/due-soon', auth, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const cars = await Car.find({
      isActive: true,
      $or: [
        { nextVerificationDue: { $lte: dueDate } },
        { nextVerificationDue: null }
      ]
    })
    .populate('owner', 'name email phone')
    .sort({ nextVerificationDue: 1 });

    const carsWithStatus = cars.map(car => ({
      ...car.toJSON(),
      daysUntilDue: car.getDaysUntilDue(),
      verificationStatus: car.getVerificationStatus()
    }));

    res.json({
      cars: carsWithStatus,
      searchParams: { days }
    });

  } catch (error) {
    logger.error('Error obteniendo vehículos por vencer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Estadísticas de vehículos (admin)
router.get('/admin/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const totalCars = await Car.countDocuments();
    const activeCars = await Car.countDocuments({ isActive: true });
    const inactiveCars = await Car.countDocuments({ isActive: false });
    
    // Vehículos por estado de verificación
    const verificationStats = await Car.aggregate([
      {
        $addFields: {
          verificationStatus: {
            $cond: {
              if: { $eq: ['$nextVerificationDue', null] },
              then: 'never_verified',
              else: {
                $cond: {
                  if: { $lt: ['$nextVerificationDue', new Date()] },
                  then: 'overdue',
                  else: 'current'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Vehículos por marca
    const brandStats = await Car.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Vehículos registrados por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegistrations = await Car.aggregate([
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
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      overview: {
        total: totalCars,
        active: activeCars,
        inactive: inactiveCars
      },
      verificationStats: verificationStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      brandStats,
      monthlyRegistrations
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de vehículos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
