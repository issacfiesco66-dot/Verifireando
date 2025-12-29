const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // SOLO MongoDB Atlas - Sin fallback a localhost
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está configurada. Configura la variable de entorno con tu connection string de Atlas.');
    }
    
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout para selección de servidor
      socketTimeoutMS: 45000, // Timeout para operaciones de socket
      maxPoolSize: 10, // Máximo de conexiones en el pool
      minPoolSize: 5, // Mínimo de conexiones en el pool
      maxIdleTimeMS: 30000, // Tiempo máximo de inactividad
      connectTimeoutMS: 10000, // Timeout de conexión inicial
    };
    
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    
    // Configurar eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB Atlas connection error:', err);
      console.error('MongoDB Atlas connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Atlas disconnected');
      console.warn('MongoDB Atlas disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB Atlas reconnected');
      console.log('MongoDB Atlas reconnected');
    });
    
    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB Atlas:', error.message);
    console.error('❌ Error connecting to MongoDB Atlas:', error.message);
    console.error('Asegúrate de que MONGODB_URI esté configurada correctamente en .env');
    throw error; // No fallback - forzar conexión a Atlas
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB Atlas connection closed');
    console.log('MongoDB Atlas connection closed');
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