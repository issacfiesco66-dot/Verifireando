const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando';
    
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout para selección de servidor
      socketTimeoutMS: 45000, // Timeout para operaciones de socket
      maxPoolSize: 10, // Máximo de conexiones en el pool
      minPoolSize: 5, // Mínimo de conexiones en el pool
      maxIdleTimeMS: 30000, // Tiempo máximo de inactividad
      connectTimeoutMS: 10000, // Timeout de conexión inicial
    };
    
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    // También emitir a consola para Render cuando se habilite LOG_TO_CONSOLE
    if (process.env.LOG_TO_CONSOLE === 'true') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    
    // Configurar eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      if (process.env.LOG_TO_CONSOLE === 'true') {
        console.error('MongoDB connection error:', err);
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      if (process.env.LOG_TO_CONSOLE === 'true') {
        console.warn('MongoDB disconnected');
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      if (process.env.LOG_TO_CONSOLE === 'true') {
        console.log('MongoDB reconnected');
      }
    });
    
    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error.message);
    
    // Fallback to in-memory database if connection fails
    try {
      logger.info('Attempting to fall back to in-memory database...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      logger.info(`Connected to in-memory MongoDB: ${uri}`);
      return conn;
    } catch (memError) {
      logger.error('Failed to start in-memory DB:', memError);
    }

    if (process.env.LOG_TO_CONSOLE === 'true') {
      console.error('Error connecting to MongoDB:', error);
    }
    logger.info('Starting without database connection for development...');
    if (process.env.LOG_TO_CONSOLE === 'true') {
      console.warn('Starting without database connection for development...');
    }
    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    if (process.env.LOG_TO_CONSOLE === 'true') {
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error.message);
    if (process.env.LOG_TO_CONSOLE === 'true') {
      console.error('Error closing MongoDB connection:', error);
    }
  }
};

module.exports = {
  connectDB,
  disconnectDB
};