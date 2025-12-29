const mongoose = require('mongoose');
require('dotenv').config();

async function checkConnection() {
  try {
    console.log('🔍 VERIFICANDO CONEXIÓN A MONGODB\n');
    console.log('=====================================\n');
    
    console.log('📋 Variables de entorno:');
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI}\n`);
    
    // Conectar
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    
    console.log('✅ CONEXIÓN EXITOSA\n');
    console.log('📊 Información de conexión:');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Puerto: ${mongoose.connection.port || 'N/A (Atlas)'}`);
    console.log(`   Base de datos: ${mongoose.connection.name}`);
    console.log(`   Tipo: ${mongoose.connection.host.includes('mongodb.net') ? 'MongoDB Atlas (Nube)' : 'MongoDB Local'}\n`);
    
    // Contar documentos
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📦 Colecciones y documentos:\n');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documentos`);
    }
    
    console.log('\n💡 CONCLUSIÓN:');
    if (mongoose.connection.host.includes('mongodb.net')) {
      console.log('   ⚠️  Los datos se están guardando en MongoDB Atlas (nube)');
      console.log('   ⚠️  NO en tu MongoDB local');
      console.log('\n   Para usar MongoDB local, edita el archivo .env:');
      console.log('   1. Comenta la línea de Atlas');
      console.log('   2. Descomenta la línea de localhost');
    } else {
      console.log('   ✅ Los datos se están guardando en MongoDB local');
      console.log(`   ✅ Ubicación: localhost:27017/verifireando`);
    }
    
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkConnection();
