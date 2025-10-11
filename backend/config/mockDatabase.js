const bcrypt = require('bcryptjs');

// Mock database en memoria para desarrollo
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
    updatedAt: new Date(),
    comparePassword: async function(password) {
      return await bcrypt.compare(password, this.password);
    }
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
    updatedAt: new Date(),
    comparePassword: async function(password) {
      return await bcrypt.compare(password, this.password);
    }
  }
];

const mockDrivers = [
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Chofer Test',
    email: 'chofer@test.com',
    phone: '+525551234569',
    password: '$2a$10$Hi0xdQdOUXJ6YlxLR7G1OeRFQkiSi1mdNC77BBNpPbQOS8tLsRWea', // 123456
    licenseNumber: 'LIC123456',
    isVerified: true,
    isActive: true,
    isOnline: false,
    isAvailable: true,
    rating: 4.8,
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: async function(password) {
      return await bcrypt.compare(password, this.password);
    }
  }
];

const mockNotifications = [
  {
    _id: '507f1f77bcf86cd799439020',
    recipient: '507f1f77bcf86cd799439011', // Cliente Test
    recipientModel: 'User',
    type: 'appointment_confirmed',
    channel: 'push',
    title: 'Cita confirmada',
    message: 'Tu cita de verificación ha sido confirmada para mañana a las 10:00 AM',
    data: { appointmentId: '507f1f77bcf86cd799439030' },
    isRead: false,
    status: 'sent',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    _id: '507f1f77bcf86cd799439021',
    recipient: '507f1f77bcf86cd799439011', // Cliente Test
    recipientModel: 'User',
    type: 'payment_received',
    channel: 'push',
    title: 'Pago recibido',
    message: 'Hemos recibido tu pago de $500.00 MXN',
    data: { paymentId: '507f1f77bcf86cd799439040' },
    isRead: true,
    status: 'sent',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    _id: '507f1f77bcf86cd799439022',
    recipient: '507f1f77bcf86cd799439013', // Chofer Test
    recipientModel: 'Driver',
    type: 'new_appointment',
    channel: 'push',
    title: 'Nueva cita asignada',
    message: 'Se te ha asignado una nueva cita de verificación',
    data: { appointmentId: '507f1f77bcf86cd799439030' },
    isRead: false,
    status: 'sent',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    _id: '507f1f77bcf86cd799439023',
    recipient: '507f1f77bcf86cd799439012', // Admin Test
    recipientModel: 'User',
    type: 'system_alert',
    channel: 'push',
    title: 'Alerta del sistema',
    message: 'Se ha registrado un nuevo usuario en la plataforma',
    data: { userId: '507f1f77bcf86cd799439011' },
    isRead: false,
    status: 'sent',
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    updatedAt: new Date(Date.now() - 10 * 60 * 1000)
  }
];

const logger = require('../utils/logger');

const connectMockDB = () => {
  logger.info('✅ Mock Database Connected (In-Memory)');
  return Promise.resolve();
};

const disconnectMockDB = () => {
  logger.info('Mock Database connection closed');
  return Promise.resolve();
};

// Mock de Mongoose para desarrollo
const mockMongoose = {
  connect: async () => {
    console.log('✅ Mock Database Connected (In-Memory)');
    return { connection: { host: 'localhost (mock)' } };
  },
  connection: {
    close: async () => {
      console.log('Mock Database connection closed');
    }
  }
};

// Mock de modelos
const createMockModel = (data) => {
  return {
    findOne: async (query) => {
      if (query.email) {
        return data.find(item => item.email === query.email && 
          (!query.role || item.role === query.role));
      }
      return data.find(item => 
        Object.keys(query).every(key => item[key] === query[key])
      );
    },
    find: async (query = {}) => {
      return data.filter(item => 
        Object.keys(query).every(key => item[key] === query[key])
      );
    },
    create: async (userData) => {
      const newItem = { 
        _id: Date.now().toString(), 
        ...userData, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      data.push(newItem);
      return newItem;
    }
  };
};

module.exports = {
  mockUsers,
  mockDrivers,
  mockNotifications,
  mockMongoose,
  createMockModel
};