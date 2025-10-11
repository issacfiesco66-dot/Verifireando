const jwt = require('jsonwebtoken');
const { mockUsers, mockDrivers } = require('../config/mockDatabase');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario o chofer en los datos mock según el rol
    let user;
    if (decoded.role === 'driver') {
      user = mockDrivers.find(d => d._id === decoded.id);
    } else {
      user = mockUsers.find(u => u._id === decoded.id);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Crear objeto user sin password para req.user
    const { password, ...userWithoutPassword } = user;
    
    req.user = {
      ...userWithoutPassword,
      id: decoded.id,
      role: decoded.role
    };
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
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
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario o chofer en los datos mock según el rol
    let user;
    if (decoded.role === 'driver') {
      user = mockDrivers.find(d => d._id === decoded.id);
    } else {
      user = mockUsers.find(u => u._id === decoded.id);
    }
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      req.user = {
        ...userWithoutPassword,
        id: decoded.id,
        role: decoded.role
      };
      req.userId = decoded.id;
      req.userRole = decoded.role;
    }
    
    next();
  } catch (error) {
    // Si hay error en el token opcional, continuar sin usuario
    next();
  }
};

module.exports = { auth, authorize, optionalAuth };