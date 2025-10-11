const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { mockUsers, mockDrivers, createMockModel } = require('../config/mockDatabase');
const { auth } = require('../middleware/auth-mock');
const logger = require('../utils/logger');

const router = express.Router();

// Mock models
const MockUser = createMockModel(mockUsers);
const MockDriver = createMockModel(mockDrivers);

// Esquemas de validación
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('client', 'driver', 'admin').default('client')
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('client', 'driver').default('client'),
  // Campos adicionales para conductores
  licenseNumber: Joi.when('role', {
    is: 'driver',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  vehicleInfo: Joi.when('role', {
    is: 'driver',
    then: Joi.object({
      brand: Joi.string().required(),
      model: Joi.string().required(),
      year: Joi.number().min(1990).max(new Date().getFullYear() + 1).required(),
      plates: Joi.string().required(),
      color: Joi.string().required()
    }).required(),
    otherwise: Joi.forbidden()
  })
});

// Función para generar token JWT
const generateToken = (user, role) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: role || user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Registro de usuarios
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { name, email, phone, password, role, licenseNumber, vehicleInfo } = value;

    // Verificar si el email ya existe
    const existingUser = await MockUser.findOne({ email });
    const existingDriver = await MockDriver.findOne({ email });
    
    if (existingUser || existingDriver) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    // Crear nuevo usuario según el rol
    let newUser;
    let userRole = role;

    if (role === 'driver') {
      // Crear conductor
      const driverData = {
        _id: `driver_${Date.now()}`,
        name,
        email,
        phone,
        password, // En un sistema real, esto se hashearía
        licenseNumber,
        vehicleInfo,
        isOnline: false,
        isAvailable: false,
        isVerified: false,
        isActive: true,
        rating: 0,
        totalRides: 0,
        verificationStatus: 'pending',
        createdAt: new Date()
      };

      // Agregar a la base de datos mock
      mockDrivers.push(driverData);
      newUser = await MockDriver.findOne({ email });
      userRole = 'driver';
    } else {
      // Crear cliente
      const clientData = {
        _id: `client_${Date.now()}`,
        name,
        email,
        phone,
        password, // En un sistema real, esto se hashearía
        role: 'client',
        isActive: true,
        createdAt: new Date()
      };

      // Agregar a la base de datos mock
      mockUsers.push(clientData);
      newUser = await MockUser.findOne({ email });
      userRole = 'client';
    }

    // Generar token
    const token = generateToken(newUser, userRole);

    logger.info(`Registro exitoso (MOCK): ${email} (${userRole})`);

    res.status(201).json({
      message: 'Registro exitoso',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: userRole,
        ...(userRole === 'driver' && {
          isOnline: newUser.isOnline,
          isAvailable: newUser.isAvailable,
          isVerified: newUser.isVerified,
          verificationStatus: newUser.verificationStatus
        })
      }
    });

  } catch (error) {
    logger.error('Error en registro (MOCK):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login con base de datos mock
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { email, password, role } = value;

    // Buscar usuario según el rol
    let user;
    let userRole = role;

    if (role === 'admin') {
      user = await MockUser.findOne({ email, role: 'admin' });
      userRole = 'admin';
    } else if (role === 'driver') {
      user = await MockDriver.findOne({ email });
      userRole = 'driver';
    } else {
      user = await MockUser.findOne({ email, role: 'client' });
      userRole = 'client';
    }

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({ message: 'Cuenta desactivada' });
    }

    // Generar token
    const token = generateToken(user, userRole);

    logger.info(`Login exitoso (MOCK): ${email} (${userRole})`);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole,
        ...(userRole === 'driver' && {
          isOnline: user.isOnline,
          isAvailable: user.isAvailable,
          rating: user.rating
        })
      }
    });

  } catch (error) {
    logger.error('Error en login (MOCK):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener perfil del usuario
router.get('/me', auth, async (req, res) => {
  try {
    const { role, id } = req.user;
    
    let user;
    if (role === 'driver') {
      user = mockDrivers.find(d => d._id === id);
    } else {
      user = mockUsers.find(u => u._id === id);
    }

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || role,
        ...(role === 'driver' && {
          isOnline: user.isOnline,
          isAvailable: user.isAvailable,
          rating: user.rating
        })
      }
    });

  } catch (error) {
    logger.error('Error obteniendo perfil (MOCK):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    logger.info(`Logout exitoso (MOCK): ${req.user.email}`);
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    logger.error('Error en logout (MOCK):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;