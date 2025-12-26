const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database en memoria
const mockUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Cliente Test',
    email: 'cliente@test.com',
    phone: '+525551234567',
    password: '$2a$10$Hi0xdQdOUXJ6YlxLR7G1OeRFQkiSi1mdNC77BBNpPbQOS8tLsRWea', // 123456
    role: 'client',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: 'Admin Test',
    email: 'admin@test.com',
    phone: '+525551234568',
    password: '$2a$10$Hi0xdQdOUXJ6YlxLR7G1OeRFQkiSi1mdNC77BBNpPbQOS8tLsRWea', // 123456
    role: 'admin',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Chofer Test',
    email: 'chofer@test.com',
    phone: '+525551234569',
    password: '$2a$10$Hi0xdQdOUXJ6YlxLR7G1OeRFQkiSi1mdNC77BBNpPbQOS8tLsRWea', // 123456
    role: 'driver',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Función para generar JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Endpoint de registro
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'client' } = req.body;

    // Validar datos requeridos
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Nombre, email, contraseña y teléfono son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = {
      _id: Date.now().toString(),
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Agregar a la base de datos mock
    mockUsers.push(newUser);

    // Generar token
    const token = generateToken(newUser._id, newUser.role);

    // Respuesta exitosa
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el registro'
    });
  }
};

// Endpoint de login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validar datos requeridos
    if (!email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar rol si se especifica
    if (role && user.role !== role) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos para acceder con este rol'
      });
    }

    // Generar token
    const token = generateToken(user._id, user.role);

    // Respuesta exitosa
    res.status(200).json({
      message: 'Login exitoso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el login'
    });
  }
};

// Endpoint para obtener información del usuario actual
const me = async (req, res) => {
  try {
    // En un mock, podemos simular que el token es válido
    // En una implementación real, aquí verificaríamos el token JWT
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        message: 'Se requiere autenticación'
      });
    }

    // Simular extracción de usuario del token
    // En una implementación real, decodificaríamos el JWT
    const token = authHeader.split(' ')[1];
    
    // Para el mock, vamos a devolver el primer usuario como ejemplo
    // En una implementación real, extraeríamos el ID del token
    const user = mockUsers[0]; // Simulación
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe'
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información del usuario'
    });
  }
};

// Endpoint de logout
const logout = async (req, res) => {
  try {
    // En un mock, simplemente devolvemos éxito
    // En una implementación real, aquí invalidaríamos el token
    res.status(200).json({
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el logout'
    });
  }
};

module.exports = { register, login, me, logout };