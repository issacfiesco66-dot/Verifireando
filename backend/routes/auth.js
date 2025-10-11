const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Esquemas de validación
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('client', 'driver').default('client'),
  // Campos adicionales para choferes
  licenseNumber: Joi.when('role', {
    is: 'driver',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  licenseExpiry: Joi.when('role', {
    is: 'driver',
    then: Joi.date().required(),
    otherwise: Joi.forbidden()
  }),
  vehicleInfo: Joi.when('role', {
    is: 'driver',
    then: Joi.object({
      brand: Joi.string().required(),
      model: Joi.string().required(),
      year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).required(),
      plates: Joi.string().required(),
      color: Joi.string().required(),
      photos: Joi.array().items(Joi.string()).optional()
    }).required(),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('client', 'driver', 'admin').default('client')
});

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  role: Joi.string().valid('client', 'driver').default('client')
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

// Función mock para enviar WhatsApp OTP
const sendWhatsAppOTP = async (phone, code) => {
  // En producción, aquí integrarías con la API de WhatsApp Business
  logger.info(`Mock WhatsApp OTP enviado a ${phone}: ${code}`);
  return { success: true, messageId: `mock_${Date.now()}` };
};

// Registro de usuario/chofer
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { name, email, phone, password, role, licenseNumber, licenseExpiry, vehicleInfo } = value;

    // Verificar si el usuario ya existe
    const Model = role === 'driver' ? Driver : User;
    const existingUser = await Model.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'El email o teléfono ya están registrados' 
      });
    }

    // Crear usuario
    const userData = { name, email, phone, password };
    if (role === 'client') {
      userData.role = 'client';
    } else if (role === 'driver') {
      userData.role = 'driver';
      userData.licenseNumber = licenseNumber;
      userData.licenseExpiry = licenseExpiry;
      userData.vehicleInfo = vehicleInfo;
    }

    const user = new Model(userData);
    
    // Generar código de verificación
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Enviar OTP por WhatsApp (mock)
    await sendWhatsAppOTP(phone, verificationCode);

    logger.info(`Usuario registrado: ${email} (${role})`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Código de verificación enviado por WhatsApp.',
      userId: user._id,
      needsVerification: true
    });

  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login
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
      user = await User.findOne({ email, role: 'admin' });
      userRole = 'admin';
    } else if (role === 'driver') {
      user = await Driver.findOne({ email });
      userRole = 'driver';
    } else {
      user = await User.findOne({ email, role: 'client' });
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

    // Para choferes, verificar si están verificados
    if (userRole === 'driver' && !user.isVerified) {
      return res.status(403).json({ 
        message: 'Tu cuenta de chofer está pendiente de verificación' 
      });
    }

    // Verificar si el usuario está verificado (para clientes)
    if (userRole === 'client' && !user.isVerified) {
      // Generar nuevo código de verificación
      const verificationCode = user.generateVerificationCode();
      await user.save();
      
      // Enviar OTP
      await sendWhatsAppOTP(user.phone, verificationCode);
      
      return res.status(403).json({ 
        message: 'Cuenta no verificada. Código de verificación enviado por WhatsApp.',
        needsVerification: true,
        userId: user._id
      });
    }

    // Generar token
    const token = generateToken(user, userRole);

    logger.info(`Login exitoso: ${email} (${userRole})`);

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
    logger.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { email, code, role } = value;

    // Buscar usuario
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar código
    if (!user.verifyCode(code)) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    // Marcar como verificado
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generar token
    const token = generateToken(user, role);

    logger.info(`OTP verificado: ${email} (${role})`);

    res.json({
      message: 'Verificación exitosa',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: role,
        isVerified: true
      }
    });

  } catch (error) {
    logger.error('Error en verificación OTP:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Reenviar OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, role = 'client' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Usuario ya verificado' });
    }

    // Generar nuevo código
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Enviar OTP
    await sendWhatsAppOTP(user.phone, verificationCode);

    res.json({ message: 'Código de verificación reenviado' });

  } catch (error) {
    logger.error('Error reenviando OTP:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener perfil del usuario autenticado
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: req.user,
      role: req.userRole
    });
  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar perfil
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'address', 'preferences'];
    const updates = {};

    // Filtrar solo campos permitidos
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No hay campos válidos para actualizar' });
    }

    const Model = req.userRole === 'driver' ? Driver : User;
    const user = await Model.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Perfil actualizado exitosamente',
      user
    });

  } catch (error) {
    logger.error('Error actualizando perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cambiar contraseña
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Contraseña actual y nueva contraseña son requeridas' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const Model = req.userRole === 'driver' ? Driver : User;
    const user = await Model.findById(req.userId);

    // Verificar contraseña actual
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    logger.info(`Contraseña cambiada: ${user.email}`);

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    logger.error('Error cambiando contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Logout (invalidar token - en producción usarías una blacklist)
router.post('/logout', auth, async (req, res) => {
  try {
    // En una implementación completa, agregarías el token a una blacklist
    logger.info(`Logout: ${req.user.email}`);
    
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    logger.error('Error en logout:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;