const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { auth } = require('../middleware/auth');
const { verifyFirebaseIdToken } = require('../config/firebase');
const logger = require('../utils/logger');
const { sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../services/emailService');

const router = express.Router();

// Esquemas de validación
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
  .message('La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, número y símbolo');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/).required(),
  password: passwordSchema.required(),
  role: Joi.string().valid('client', 'driver').default('client'),
  // Campos opcionales para conductores
  licenseNumber: Joi.string().optional(),
  licenseExpiry: Joi.alternatives().try(
    Joi.date(),
    Joi.string().isoDate(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/) // Formato YYYY-MM-DD
  ).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
}).unknown(false); // Rechaza campos adicionales como 'role'

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  role: Joi.string().valid('client', 'driver').default('client')
});

// Función para generar JWT
const generateToken = (user, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurada');
  }
  
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.AUTH_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10)
    : 10,
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.OTP_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS, 10)
    : 5,
  standardHeaders: true,
  legacyHeaders: false
});

// Función mock para enviar WhatsApp OTP
const sendWhatsAppOTP = async (phone, code) => {
  // En producción, aquí integrarías con la API de WhatsApp Business
  logger.info(`Mock WhatsApp OTP enviado a ${phone}: ${code}`);
  return { success: true, messageId: `mock_${Date.now()}` };
};

// Helper: buscar chofer en User o migrar desde Driver
const findOrMigrateDriverByEmail = async (email) => {
  let user = await User.findOne({ email, role: 'driver' });
  if (user) return user;

  const driver = await Driver.findOne({ email });
  if (!driver) return null;

  const driverLocation = driver.location?.coordinates?.length === 2
    ? { lat: driver.location.coordinates[1], lng: driver.location.coordinates[0] }
    : undefined;

  await User.findByIdAndUpdate(
    driver._id,
    {
      $set: {
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        password: driver.password, // ya está hasheada en Driver
        role: 'driver',
        isActive: driver.isActive ?? true,
        isVerified: driver.isVerified ?? false,
        isOnline: driver.isOnline ?? false,
        isAvailable: driver.isAvailable ?? false,
        location: driver.location,
        verificationCode: driver.verificationCode,
        verificationCodeExpires: driver.verificationCodeExpires,
        driverProfile: {
          licenseNumber: driver.licenseNumber,
          licenseExpiry: driver.licenseExpiry,
          isVerifiedDriver: driver.isVerified ?? false,
          vehicleInfo: driver.vehicleInfo,
          rating: driver.rating?.average || 0,
          totalTrips: driver.completedTrips || 0,
          isOnline: driver.isOnline ?? false,
          isAvailable: driver.isAvailable ?? false,
          currentLocation: driverLocation
        }
      }
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  user = await User.findById(driver._id);
  return user;
};

// Registro de usuario/chofer
router.post('/register', authLimiter, async (req, res) => {
  try {
    logger.info('Registro - Datos recibidos:', { role: req.body.role, email: req.body.email });
    
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      logger.error('Registro - Error de validación:', error.details.map(d => ({ field: d.path, message: d.message })));
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    let { name, email, phone, password, role, licenseNumber, licenseExpiry } = value;

    // Si es chofer, validar campos requeridos
    if (role === 'driver') {
      if (!licenseNumber) {
        return res.status(400).json({ 
          message: 'Número de licencia es requerido para choferes' 
        });
      }
      // licenseExpiry es opcional - si no se proporciona, usar fecha por defecto (1 año desde ahora)
      if (!licenseExpiry) {
        licenseExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      } else if (typeof licenseExpiry === 'string') {
        // Convertir string a Date si viene como string
        licenseExpiry = new Date(licenseExpiry);
      }
    }

    // Verificar si el usuario ya existe (buscar en User y Driver)
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    const existingDriver = await Driver.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser || existingDriver) {
      return res.status(409).json({ 
        message: 'El email o teléfono ya están registrados' 
      });
    }

    // Si es chofer, crear en el modelo User (unificado)
    if (role === 'driver') {
      const driverData = {
        name,
        email,
        phone,
        password,
        role: 'driver',
        isActive: true,
        isAvailable: false,
        isOnline: false,
        isVerified: false,
        driverProfile: {
          licenseNumber,
          licenseExpiry,
          isVerifiedDriver: false,
          isOnline: false,
          isAvailable: false
        }
      };

      const driverUser = new User(driverData);
      const verificationCode = driverUser.generateVerificationCode();

      try {
        await driverUser.save();
      } catch (saveError) {
        logger.error('Error guardando chofer:', saveError);
        if (saveError.name === 'ValidationError') {
          const validationErrors = Object.values(saveError.errors).map(err => err.message);
          return res.status(400).json({ 
            message: 'Error de validación al crear chofer',
            errors: validationErrors
          });
        }
        if (saveError.code === 11000) {
          const field = Object.keys(saveError.keyPattern)[0];
          return res.status(409).json({ 
            message: `El ${field === 'email' ? 'email' : field === 'licenseNumber' ? 'número de licencia' : field} ya está registrado`
          });
        }
        throw saveError;
      }

      await sendWhatsAppOTP(phone, verificationCode);
      logger.info(`Chofer registrado: ${email} - Código: ${verificationCode}`);

      const responsePayload = {
        message: 'Chofer registrado exitosamente. Código de verificación enviado por WhatsApp.',
        userId: driverUser._id,
        needsVerification: true
      };
      if (process.env.NODE_ENV === 'development') {
        responsePayload.devCode = verificationCode;
      }
      return res.status(201).json(responsePayload);
    }

    // Si es cliente, crear en el modelo User
    const userData = { 
      name, 
      email, 
      phone, 
      password,
      role: 'client',
      isActive: true,
      isVerified: false
    };

    const user = new User(userData);
    const verificationCode = user.generateVerificationCode();
    await user.save();

    await sendWhatsAppOTP(phone, verificationCode);
    logger.info(`Cliente registrado: ${email} - Código: ${verificationCode}`);

    const responsePayload = {
      message: 'Usuario registrado exitosamente. Código de verificación enviado por WhatsApp.',
      userId: user._id,
      needsVerification: true
    };
    if (process.env.NODE_ENV === 'development') {
      responsePayload.devCode = verificationCode;
    }
    res.status(201).json(responsePayload);

  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login para clientes (solo busca en User con role='client')
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.error('Login Cliente - Validación fallida:', error.details);
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { email, password } = value;
    logger.info(`Login Cliente intento - Email: ${email}`);

    // Buscar solo en User con role='client' o 'admin'
    const user = await User.findOne({ 
      email,
      role: { $in: ['client', 'admin'] }
    });
    
    if (!user) {
      logger.error('Login Cliente - Usuario no encontrado o no es cliente/admin');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const userRole = user.role;
    logger.info(`Login Cliente - Usuario encontrado con rol: ${userRole}`);

    // Verificar contraseña
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.error('Login Cliente - Contraseña inválida');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({ message: 'Cuenta desactivada' });
    }

    // Verificar si el usuario está verificado
    if (!user.isVerified) {
      const verificationCode = user.generateVerificationCode();
      await user.save();
      await sendWhatsAppOTP(user.phone, verificationCode);
      logger.info(`Código OTP generado para ${email}: ${verificationCode}`);
      const responsePayload = { 
        message: 'Cuenta no verificada. Código de verificación enviado por WhatsApp.',
        needsVerification: true,
        userId: user._id
      };
      if (process.env.NODE_ENV === 'development') {
        responsePayload.devCode = verificationCode;
      }
      return res.status(403).json(responsePayload);
    }

    // Generar token
    const token = generateToken(user, userRole);
    logger.info(`Login Cliente exitoso: ${email} (${userRole})`);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole
      }
    });

  } catch (error) {
    logger.error('Error en login cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login para choferes (busca en Driver)
router.post('/login/driver', authLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.error('Login Chofer - Validación fallida:', error.details);
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { email, password } = value;
    logger.info(`Login Chofer intento - Email: ${email}`);

    // Buscar en User (modelo unificado) o migrar desde Driver
    const driver = await findOrMigrateDriverByEmail(email);
    
    if (!driver) {
      logger.error('Login Chofer - Chofer no encontrado');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    logger.info(`Login Chofer - Chofer encontrado: ${driver.email}`);

    // Verificar contraseña
    const isValidPassword = await driver.comparePassword(password);
    if (!isValidPassword) {
      logger.error('Login Chofer - Contraseña inválida');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el chofer está activo
    if (!driver.isActive) {
      return res.status(403).json({ message: 'Cuenta desactivada' });
    }

    // Verificar si el chofer está verificado
    if (!driver.isVerified) {
      const verificationCode = driver.generateVerificationCode();
      await driver.save();
      await sendWhatsAppOTP(driver.phone, verificationCode);
      logger.info(`Código OTP generado para ${email}: ${verificationCode}`);
      const responsePayload = { 
        message: 'Cuenta no verificada. Código de verificación enviado por WhatsApp.',
        needsVerification: true,
        userId: driver._id
      };
      if (process.env.NODE_ENV === 'development') {
        responsePayload.devCode = verificationCode;
      }
      return res.status(403).json(responsePayload);
    }

    // Actualizar estado a online y disponible (top-level y driverProfile)
    driver.isOnline = true;
    driver.isAvailable = true;
    if (!driver.driverProfile) {
      driver.driverProfile = {};
    }
    driver.driverProfile.isOnline = true;
    driver.driverProfile.isAvailable = true;
    await driver.save();
    logger.info(`Chofer ${email} marcado como online y disponible`);

    // Generar token
    const token = generateToken(driver, 'driver');
    logger.info(`Login Chofer exitoso: ${email}`);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: 'driver',
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        rating: driver.driverProfile?.rating || driver.rating?.average || 0,
        licenseNumber: driver.driverProfile?.licenseNumber || driver.licenseNumber
      }
    });

  } catch (error) {
    logger.error('Error en login chofer:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar OTP
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { email, code, role } = value;

    // Buscar según el rol
    let user = null;
    let userRole = role || 'client';

    if (role === 'driver') {
      user = await findOrMigrateDriverByEmail(email);
      userRole = 'driver';
    } else {
      user = await User.findOne({ email, role: { $in: ['client', 'admin'] } });
      if (user) {
        userRole = user.role;
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar código usando el método del modelo que compara con la BD
    const isCodeValid = user.verifyCode(code);
    if (!isCodeValid) {
      logger.warn(`OTP inválido para ${email}. Recibido: ${code}, Esperado: ${user.verificationCode}, Expira: ${user.verificationCodeExpires}`);
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    // Marcar como verificado
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    logger.info(`Usuario verificado exitosamente: ${email} (${userRole})`);

    // Generar token
    const token = generateToken(user, userRole);

    logger.info(`OTP verificado: ${email} (${userRole})`);

    res.json({
      message: 'Verificación exitosa',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole,
        isVerified: true,
        ...(userRole === 'driver' && {
          isOnline: user.isOnline,
          isAvailable: user.isAvailable,
          rating: user.driverProfile?.rating || user.rating?.average || 0
        })
      }
    });

  } catch (error) {
    logger.error('Error en verificación OTP:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Reenviar OTP (con alias para compatibilidad)
router.post(['/resend-otp', '/resend-verification'], otpLimiter, async (req, res) => {
  try {
    const { email, role = 'client' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    // Buscar según el rol
    let user = null;
    
    if (role === 'driver') {
      user = await findOrMigrateDriverByEmail(email);
    } else {
      user = await User.findOne({ email, role: { $in: ['client', 'admin'] } });
    }

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
    
    logger.info(`Código OTP reenviado para ${email} (${role}): ${verificationCode}`);

    const responsePayload = { message: 'Código de verificación reenviado' };
    if (process.env.NODE_ENV === 'development') {
      responsePayload.devCode = verificationCode;
    }
    res.json(responsePayload);

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

    // Todos los usuarios están en el modelo User ahora
    const user = await User.findByIdAndUpdate(
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

    const { error: pwdError } = passwordSchema.validate(newPassword);
    if (pwdError) {
      return res.status(400).json({ 
        message: pwdError.message || 'La nueva contraseña no cumple los requisitos de seguridad'
      });
    }

    // Todos los usuarios están en el modelo User ahora
    const user = await User.findById(req.userId);

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
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { idToken, email, name, photoURL, role } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email es requerido' 
      });
    }
    if (!idToken) {
      return res.status(400).json({ message: 'Token de Google requerido' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Email inválido' 
      });
    }

    logger.info(`Google sign-in attempt: ${email}`);

    const decoded = await verifyFirebaseIdToken(idToken);
    if (!decoded || !decoded.email) {
      return res.status(401).json({ message: 'Token de Google inválido' });
    }
    if (decoded.email !== email) {
      return res.status(401).json({ message: 'Email no coincide con el token' });
    }
    
    // Validación adicional: verificar que el nombre y email sean consistentes
    if (name && name.length > 100) {
      return res.status(400).json({ 
        message: 'Nombre demasiado largo' 
      });
    }

    logger.info(`Google authentication accepted for: ${email}`);

    // Buscar usuario existente
    let user = await User.findOne({ email });
    
    if (!user) {
      // Validar rol si se proporciona
      const validRoles = ['client', 'driver', 'admin'];
      const userRole = role && validRoles.includes(role) ? role : 'client';
      
      // Crear nuevo usuario si no existe
      user = new User({
        name: name || email.split('@')[0],
        email,
        phone: '+520000000000', // Teléfono por defecto, debe ser actualizado
        password: 'google_oauth_user', // Contraseña placeholder
        role: userRole,
        isActive: true,
        isVerified: true, // Los usuarios de Google se consideran verificados
        authProvider: 'google',
        photoURL: photoURL || null
      });
      
      // Si es driver, agregar campos básicos del driverProfile
      if (userRole === 'driver') {
        user.driverProfile = {
          isVerifiedDriver: false,
          rating: 0,
          totalTrips: 0,
          isOnline: false,
          isAvailable: false
        };
      }
      
      await user.save();
      logger.info(`New Google user created: ${email} with role: ${userRole}`);
    } else {
      // Usuario existente: mantener su rol actual (no cambiar el rol de un usuario existente)
      // Solo actualizar información de sesión
      user.lastLogin = new Date();
      if (photoURL && !user.photoURL) {
        user.photoURL = photoURL;
      }
      await user.save();
      logger.info(`Existing Google user logged in: ${email} with existing role: ${user.role}`);
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
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

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email }) || await Driver.findOne({ email });
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ 
        message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña' 
      });
    }

    // Generar token de recuperación (válido por 1 hora)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enviar email con el token
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    
    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Error al enviar el email de recuperación. Intenta más tarde.' 
      });
    }
    
    logger.info(`Password reset email sent to: ${email}`);
    
    res.json({ 
      message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña',
      // En desarrollo, devolvemos el token para pruebas
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    logger.error('Error en forgot password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Validate reset token
router.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'El token es requerido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ 
        message: 'Token inválido' 
      });
    }

    // Buscar usuario para verificar que existe
    let user = await User.findById(decoded.userId);
    if (!user) {
      user = await Driver.findById(decoded.userId);
    }

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    res.json({ valid: true });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }
    
    logger.error('Error en validate reset token:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'El token y la nueva contraseña son requeridos' 
      });
    }

    // Validar formato de contraseña
    const { error } = passwordSchema.validate(newPassword);
    if (error) {
      return res.status(400).json({ 
        message: error.details[0].message 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ 
        message: 'Token inválido' 
      });
    }

    // Buscar usuario y actualizar contraseña
    let user = await User.findById(decoded.userId);
    if (!user) {
      user = await Driver.findById(decoded.userId);
    }

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    user.password = newPassword;
    await user.save();

    // Enviar email de confirmación
    await sendPasswordResetConfirmation(user.email);

    logger.info(`Password reset successful for: ${user.email}`);
    
    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }
    
    logger.error('Error en reset password:', error);
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
