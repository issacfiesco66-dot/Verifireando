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

// Función para generar JWT
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