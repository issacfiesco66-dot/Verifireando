const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando';
    
    const conn = await mongoose.connect(mongoURI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error.message);
    logger.info('Starting without database connection for development...');
    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};