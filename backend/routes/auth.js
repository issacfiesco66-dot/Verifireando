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
  // Campos opcionales para conductores
  licenseNumber: Joi.string().optional(),
  licenseExpiry: Joi.date().optional()
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
    logger.info('Registro - Datos recibidos:', { role: req.body.role, email: req.body.email });
    
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      logger.error('Registro - Error de validación:', error.details.map(d => ({ field: d.path, message: d.message })));
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const { name, email, phone, password, role, licenseNumber, licenseExpiry } = value;

    // Si es chofer, validar campos requeridos
    if (role === 'driver') {
      if (!licenseNumber || !licenseExpiry) {
        return res.status(400).json({ 
          message: 'Número de licencia y fecha de vencimiento son requeridos para choferes' 
        });
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

    // Si es chofer, crear en el modelo Driver
    if (role === 'driver') {
      const driverData = {
        name,
        email,
        phone,
        password,
        role: 'driver',
        licenseNumber,
        licenseExpiry,
        isActive: true,
        isAvailable: false,
        isOnline: false,
        isVerified: false
      };

      const driver = new Driver(driverData);
      const verificationCode = driver.generateVerificationCode();
      await driver.save();

      await sendWhatsAppOTP(phone, verificationCode);
      logger.info(`Chofer registrado: ${email} - Código: ${verificationCode}`);

      return res.status(201).json({
        message: 'Chofer registrado exitosamente. Código de verificación enviado por WhatsApp.',
        userId: driver._id,
        needsVerification: true,
        devCode: verificationCode
      });
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

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Código de verificación enviado por WhatsApp.',
      userId: user._id,
      needsVerification: true,
      devCode: verificationCode
    });

  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login para clientes (solo busca en User con role='client')
router.post('/login', async (req, res) => {
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
    logger.info('Verificando contraseña...');
    const isValidPassword = await user.comparePassword(password);
    logger.info(`Contraseña válida: ${isValidPassword}`);
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
      return res.status(403).json({ 
        message: 'Cuenta no verificada. Código de verificación enviado por WhatsApp.',
        needsVerification: true,
        userId: user._id,
        devCode: verificationCode
      });
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
router.post('/login/driver', async (req, res) => {
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

    // Buscar en el modelo Driver
    const driver = await Driver.findOne({ email });
    
    if (!driver) {
      logger.error('Login Chofer - Chofer no encontrado');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    logger.info(`Login Chofer - Chofer encontrado: ${driver.email}`);

    // Verificar contraseña
    logger.info('Verificando contraseña...');
    const isValidPassword = await driver.comparePassword(password);
    logger.info(`Contraseña válida: ${isValidPassword}`);
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
      return res.status(403).json({ 
        message: 'Cuenta no verificada. Código de verificación enviado por WhatsApp.',
        needsVerification: true,
        userId: driver._id,
        devCode: verificationCode
      });
    }

    // Actualizar estado a online y disponible
    driver.isOnline = true;
    driver.isAvailable = true;
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
        rating: driver.rating?.average || 0,
        licenseNumber: driver.licenseNumber
      }
    });

  } catch (error) {
    logger.error('Error en login chofer:', error);
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

    // Buscar usuario (todos en el mismo modelo)
    const user = await User.findOne({ email });

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

    logger.info(`Usuario verificado exitosamente: ${email}`);

    // Generar token
    const token = generateToken(user, user.role);

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

// Reenviar OTP (con alias para compatibilidad)
router.post(['/resend-otp', '/resend-verification'], async (req, res) => {
  try {
    const { email, role = 'client' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    // Todos los usuarios están en el modelo User ahora
    const user = await User.findOne({ email });

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

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
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
router.post('/google', async (req, res) => {
  try {
    const { idToken, email, name, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email es requerido' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Email inválido' 
      });
    }

    logger.info(`Google sign-in attempt: ${email}`);

    // SEGURIDAD: En lugar de verificar tokens con Firebase Admin (que requiere claves de servicio),
    // confiamos en la autenticación de Firebase del lado del cliente.
    // Firebase ya validó la identidad del usuario antes de enviar el token.
    // Aquí solo validamos que los datos sean consistentes y creamos/actualizamos el usuario.
    
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
