const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a MongoDB Atlas...');
    console.log('URI:', process.env.MONGODB_URI);
    
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 15000,
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    console.log('Host:', conn.connection.host);
    console.log('Base de datos:', conn.connection.name);
    
    // Listar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Colecciones disponibles:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  }
}

testConnection();