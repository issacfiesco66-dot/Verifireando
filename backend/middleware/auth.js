const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { verifyFirebaseIdToken } = require('../config/firebase');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Auth: No token provided');
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    // Primero intentar JWT tradicional
    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret-key';
      logger.info(`Auth: Attempting JWT verification`);
      logger.info(`Auth: Using secret: ${secret}`);
      logger.info(`Auth: Secret length: ${secret.length}`);
      
      const decoded = jwt.verify(token, secret);
      logger.info(`Auth: JWT decoded successfully for user ID: ${decoded.id}`);
      let user;
      if (decoded.role === 'driver') {
        user = await Driver.findById(decoded.id).select('-password');
      } else {
        user = await User.findById(decoded.id).select('-password');
      }
      if (!user) {
        logger.warn(`Auth: User not found for ID ${decoded.id} (Role: ${decoded.role})`);
        return res.status(401).json({ message: 'Token inválido' });
      }
      logger.info(`Auth: User found: ${user.email}`);
      req.user = user;
      req.userId = decoded.id;
      req.userRole = decoded.role;
      logger.info('Auth: Middleware completed successfully, calling next()');
      return next();
    } catch (jwtErr) {
      logger.warn(`Auth: JWT verification failed: ${jwtErr.message}`);
      // Si el JWT falla, intentar verificar como Firebase ID Token
      // logger.debug('Auth: JWT verification failed, trying Firebase', jwtErr.message);
    }

    const firebaseDecoded = await verifyFirebaseIdToken(token);
    if (!firebaseDecoded) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const email = firebaseDecoded.email || null;
    const name = firebaseDecoded.name || (email ? email.split('@')[0] : 'Usuario');
    const emailVerified = !!firebaseDecoded.email_verified;

    // Intentar mapear a registros existentes (driver o user)
    let userDoc = null;
    let role = 'client';

    if (email) {
      const existingDriver = await Driver.findOne({ email }).select('-password');
      if (existingDriver) {
        userDoc = existingDriver;
        role = 'driver';
      } else {
        const existingUser = await User.findOne({ email }).select('-password');
        if (existingUser) {
          userDoc = existingUser;
          role = existingUser.role || 'client';
        }
      }
    }

    // Si no existe, crear usuario cliente por defecto (sin teléfono real)
    if (!userDoc) {
      const placeholderPhone = '0000000000'; // válido por el patrón: 10 dígitos
      const randomPassword = Math.random().toString(36).slice(2, 10) + 'Aa1';
      const safeEmail = email || `user_${firebaseDecoded.uid}@firebase.local`;
      const newUser = new User({
        name,
        email: safeEmail,
        phone: placeholderPhone,
        password: randomPassword,
        role: 'client',
        isVerified: emailVerified,
        isActive: true
      });
      await newUser.save();
      userDoc = await User.findById(newUser._id).select('-password');
      role = 'client';
    }

    req.user = userDoc;
    req.userId = userDoc._id.toString();
    req.userRole = role;
    return next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    // Asegurar que roles sea un array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.userRole)) {
      logger.warn(`Authorization failed: User role '${req.userRole}' not in allowed roles [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        message: 'No tienes permisos para acceder a este recurso' 
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Intentar JWT primero
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        let user;
        if (decoded.role === 'driver') {
          user = await Driver.findById(decoded.id).select('-password');
        } else {
          user = await User.findById(decoded.id).select('-password');
        }
        if (user) {
          req.user = user;
          req.userId = decoded.id;
          req.userRole = decoded.role;
          return next();
        }
      } catch (jwtErr) {
        // Ignorar y probar Firebase
      }

      const firebaseDecoded = await verifyFirebaseIdToken(token);
      if (firebaseDecoded) {
        const email = firebaseDecoded.email || null;
        let userDoc = null;
        let role = 'client';
        if (email) {
          const existingDriver = await Driver.findOne({ email }).select('-password');
          if (existingDriver) {
            userDoc = existingDriver;
            role = 'driver';
          } else {
            const existingUser = await User.findOne({ email }).select('-password');
            if (existingUser) {
              userDoc = existingUser;
              role = existingUser.role || 'client';
            }
          }
        }
        if (userDoc) {
          req.user = userDoc;
          req.userId = userDoc._id.toString();
          req.userRole = role;
        }
      }
    }
    next();
  } catch (error) {
    // Continuar sin autenticación
    next();
  }
};

module.exports = { auth, authorize, optionalAuth };
