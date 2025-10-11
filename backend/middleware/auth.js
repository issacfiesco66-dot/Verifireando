const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario o chofer según el rol
    let user;
    if (decoded.role === 'driver') {
      user = await Driver.findById(decoded.id).select('-password');
    } else {
      user = await User.findById(decoded.id).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = user;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
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
      }
    }
    
    next();
  } catch (error) {
    // Si hay error en el token opcional, continuar sin autenticación
    next();
  }
};

module.exports = { auth, authorize, optionalAuth };