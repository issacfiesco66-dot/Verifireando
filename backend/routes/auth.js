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
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  logger.info(`JWT: Using secret: ${secret}`);
  logger.info(`JWT: Secret length: ${secret.length}`);
  
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: role || user.role 
    },
    secret,
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

    // En entorno de desarrollo, devolver el código en la respuesta para facilitar pruebas
    if (process.env.NODE_ENV === 'development') {
      return res.status(201).json({
        message: 'Usuario registrado exitosamente. Código de verificación enviado por WhatsApp.',
        userId: user._id,
        needsVerification: true,
        devCode: verificationCode // SOLO EN DESARROLLO
      });
    }

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
      logger.error('Login - Validación fallida:', error.details);
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { email, password, role } = value;
    logger.info(`Login intento - Email: ${email}, Role: ${role}`);

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

    logger.info(`Usuario encontrado: ${user ? 'Sí' : 'No'}`);

    if (!user) {
      logger.error('Login - Usuario no encontrado');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    logger.info('Verificando contraseña...');
    const isValidPassword = await user.comparePassword(password);
    logger.info(`Contraseña válida: ${isValidPassword}`);
    if (!isValidPassword) {
      logger.error('Login - Contraseña inválida');
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
      
      // En entorno de desarrollo, devolver el código en la respuesta para facilitar pruebas
      if (process.env.NODE_ENV === 'development') {
        return res.status(403).json({ 
          message: 'Cuenta no verificada. Código de verificación enviado por WhatsApp.',
          needsVerification: true,
          userId: user._id,
          devCode: verificationCode // SOLO EN DESARROLLO
        });
      }

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
          rating: user.rating?.average || 0
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
    const isCodeValid = user.verifyCode(code);
    if (!isCodeValid) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`OTP inválido para ${email}. Recibido: ${code}, Esperado: ${user.verificationCode}`);
      }
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

// Obtener perfil del usuario autenticado (Alias para compatibilidad frontend)
router.get(['/profile', '/me'], auth, async (req, res) => {
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

// Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { idToken, email, name, photoURL } = req.body;

    if (!idToken || !email) {
      return res.status(400).json({ 
        message: 'Token de Google y email son requeridos' 
      });
    }

    logger.info(`Google sign-in attempt: ${email}`);

    // Verificar el token de Firebase - en desarrollo permitir sin verificación
    const { verifyFirebaseIdToken } = require('../config/firebase');
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const decodedToken = await verifyFirebaseIdToken(idToken);
        if (!decodedToken) {
          return res.status(401).json({ 
            message: 'Token de Google inválido' 
          });
        }
        logger.info(`Firebase token verified for: ${decodedToken.email}`);
      } catch (firebaseError) {
        logger.error('Firebase token verification failed:', firebaseError);
        return res.status(401).json({ 
          message: 'Token de Google inválido' 
        });
      }
    } else {
      // En desarrollo, intentar verificar pero permitir si falla
      try {
        const decodedToken = await verifyFirebaseIdToken(idToken);
        if (decodedToken) {
          logger.info(`Firebase token verified for: ${decodedToken.email}`);
        } else {
          logger.info('Development mode: Firebase not available, proceeding without verification');
        }
      } catch (firebaseError) {
        logger.info('Development mode: Firebase verification failed, proceeding without verification');
      }
    }

    // Buscar usuario existente
    let user = await User.findOne({ email });
    
    if (!user) {
      // Crear nuevo usuario si no existe
      user = new User({
        name: name || email.split('@')[0],
        email,
        phone: '+520000000000', // Teléfono por defecto, debe ser actualizado
        password: 'google_oauth_user', // Contraseña placeholder
        role: 'client',
        isActive: true,
        isVerified: true, // Los usuarios de Google se consideran verificados
        authProvider: 'google',
        photoURL: photoURL || null
      });
      
      await user.save();
      logger.info(`New Google user created: ${email}`);
    } else {
      // Actualizar usuario existente
      user.lastLogin = new Date();
      if (photoURL && !user.photoURL) {
        user.photoURL = photoURL;
      }
      await user.save();
      logger.info(`Existing Google user logged in: ${email}`);
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login con Google exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photoURL: user.photoURL
      }
    });

  } catch (error) {
    logger.error('Error en Google sign-in:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
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
