#!/bin/bash

echo "🔧 REPARANDO SERVIDOR EN PRODUCCIÓN"
echo "===================================="
echo ""

# Detener PM2
echo "1️⃣  Deteniendo servidor..."
pm2 stop all

# Ir al directorio
cd /var/www/verifireando/backend/routes

# Restaurar backup más reciente
echo "2️⃣  Restaurando backup..."
LATEST_BACKUP=$(ls -t auth.js.backup* 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" auth.js
    echo "   ✅ Backup restaurado: $LATEST_BACKUP"
else
    echo "   ⚠️  No se encontró backup"
fi

# Crear versión correcta del registerSchema
echo "3️⃣  Creando archivo auth.js correcto..."

# Descargar versión correcta desde tu repositorio local
# O crear una versión limpia
cat > /tmp/auth_fixed.js << 'ENDOFFILE'
const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Esquemas de validación
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('client', 'driver').default('client')
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
      role: role || user.role,
      name: user.name
    },
    secret,
    { expiresIn: '7d' }
  );
};

// Función mock para enviar OTP por WhatsApp
const sendWhatsAppOTP = async (phone, code) => {
  logger.info(`Mock WhatsApp OTP enviado a ${phone}: ${code}`);
  return { success: true, messageId: `mock_${Date.now()}` };
};

// POST /api/auth/register - Registro unificado
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    
    if (error) {
      logger.error('Registro - Error de validación:', error.details.map(d => ({ field: d.path, message: d.message })));
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { name, email, phone, password, role } = value;

    logger.info('Registro - Datos recibidos:', { email, role, hasVehicleInfo: !!req.body.vehicleInfo });

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Crear usuario
    const user = new User({
      name,
      email,
      phone,
      password,
      role: role || 'client',
      isVerified: false
    });

    // Generar código de verificación
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Enviar OTP
    await sendWhatsAppOTP(phone, verificationCode);

    logger.info(`Usuario registrado: ${email} (${role || 'client'})`);

    // En desarrollo, auto-verificar
    if (process.env.NODE_ENV === 'development') {
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();

      const token = generateToken(user, role || 'client');

      return res.status(201).json({
        message: 'Usuario registrado y verificado automáticamente (desarrollo)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    res.status(201).json({
      message: 'Usuario registrado. Revisa tu WhatsApp para el código de verificación.',
      userId: user._id,
      needsVerification: true
    });

  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { email, password, role: userRole } = value;

    logger.info(`Login intento - Email: ${email}, Role: ${userRole}`);

    // Buscar usuario
    const user = await User.findOne({ email });

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

    // Verificar si el usuario está verificado
    if (!user.isVerified) {
      // Generar nuevo código de verificación
      const verificationCode = user.generateVerificationCode();
      await user.save();
      
      // Enviar OTP
      await sendWhatsAppOTP(user.phone, verificationCode);
      
      logger.info(`Código OTP generado para ${email}: ${verificationCode}`);
      
      // En entorno de desarrollo, devolver el código
      if (process.env.NODE_ENV === 'development') {
        return res.status(403).json({ 
          message: 'Cuenta no verificada. Código de verificación enviado por WhatsApp.',
          needsVerification: true,
          userId: user._id,
          devCode: verificationCode
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
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/auth/verify-otp
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Usuario ya verificado' });
    }

    const isValidCode = user.verifyOTP(code);

    if (!isValidCode) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = generateToken(user, role);

    logger.info(`OTP verificado: ${email} (${role})`);

    res.json({
      message: 'Cuenta verificada exitosamente',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Error en verify-otp:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        photoURL: user.photoURL
      }
    });

  } catch (error) {
    logger.error('Error en /me:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
ENDOFFILE

# Copiar el archivo corregido
cp /tmp/auth_fixed.js auth.js
echo "   ✅ Archivo auth.js actualizado"

# Verificar que el archivo termine con module.exports
echo "4️⃣  Verificando archivo..."
tail -3 auth.js

# Iniciar PM2
echo ""
echo "5️⃣  Iniciando servidor..."
cd /var/www/verifireando/backend
pm2 start all

sleep 5

echo ""
echo "6️⃣  Verificando estado..."
pm2 list

echo ""
echo "✅ REPARACIÓN COMPLETADA"
echo ""
echo "Prueba el registro ahora desde tu app"
ENDOFFILE

chmod +x /tmp/fix-production-now.sh
bash /tmp/fix-production-now.sh
