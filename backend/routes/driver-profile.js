const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Esquema de validación para perfil de conductor
const driverProfileSchema = Joi.object({
  licenseNumber: Joi.string().required(),
  licenseExpiry: Joi.date().required(),
  licenseDocument: Joi.string().uri().optional(),
  vehicleInfo: Joi.object({
    brand: Joi.string().optional(),
    model: Joi.string().optional(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).optional(),
    plates: Joi.string().optional(),
    color: Joi.string().optional(),
    photos: Joi.array().items(Joi.string().uri()).optional()
  }).optional()
});

// Actualizar perfil de conductor (subir licencia y documentos)
router.put('/profile', auth, authorize('driver'), async (req, res) => {
  try {
    const { error, value } = driverProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar perfil de conductor
    user.driverProfile = {
      ...user.driverProfile,
      ...value,
      isVerifiedDriver: false // Se verificará manualmente por admin
    };

    await user.save();

    logger.info(`Perfil de conductor actualizado: ${user.email}`);

    res.json({
      message: 'Perfil de conductor actualizado exitosamente. Pendiente de verificación.',
      driverProfile: user.driverProfile
    });

  } catch (error) {
    logger.error('Error actualizando perfil de conductor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener perfil de conductor
router.get('/profile', auth, authorize('driver'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driverProfile: user.driverProfile || {}
      }
    });

  } catch (error) {
    logger.error('Error obteniendo perfil de conductor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar ubicación del conductor
router.put('/location', auth, authorize('driver'), async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitud y longitud requeridas' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.driverProfile) {
      user.driverProfile = {};
    }

    user.driverProfile.currentLocation = {
      lat,
      lng,
      lastUpdate: new Date()
    };

    await user.save();

    res.json({
      message: 'Ubicación actualizada',
      location: user.driverProfile.currentLocation
    });

  } catch (error) {
    logger.error('Error actualizando ubicación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar estado online
router.put('/online-status', auth, authorize('driver'), async (req, res) => {
  try {
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ message: 'Estado online requerido' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.driverProfile) {
      user.driverProfile = {};
    }

    user.driverProfile.isOnline = isOnline;
    if (!isOnline) {
      user.driverProfile.isAvailable = false;
    }

    await user.save();

    res.json({
      message: 'Estado actualizado',
      isOnline: user.driverProfile.isOnline,
      isAvailable: user.driverProfile.isAvailable
    });

  } catch (error) {
    logger.error('Error actualizando estado online:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar disponibilidad
router.put('/availability', auth, authorize('driver'), async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'Disponibilidad requerida' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.driverProfile) {
      user.driverProfile = {};
    }

    // Solo puede estar disponible si está online
    if (isAvailable && !user.driverProfile.isOnline) {
      return res.status(400).json({ 
        message: 'Debes estar en línea para estar disponible' 
      });
    }

    user.driverProfile.isAvailable = isAvailable;
    await user.save();

    res.json({
      message: 'Disponibilidad actualizada',
      isAvailable: user.driverProfile.isAvailable
    });

  } catch (error) {
    logger.error('Error actualizando disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
