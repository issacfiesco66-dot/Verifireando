const mongoose = require('mongoose');
const Driver = require('../models/Driver');
require('dotenv').config();

async function verifyDriver() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');
    
    // Buscar al chofer Miguel Rodriguez
    const driver = await Driver.findOne({ 
      $or: [
        { name: /Miguel/i },
        { email: /miguel/i }
      ]
    });
    
    if (!driver) {
      console.log('❌ Chofer no encontrado');
      return;
    }
    
    console.log('🎯 Chofer encontrado:');
    console.log('- ID:', driver._id);
    console.log('- Nombre:', driver.name);
    console.log('- Email:', driver.email);
    console.log('- Estado actual - Verificado:', driver.isVerified);
    console.log('- Estado actual - Activo:', driver.isActive);
    console.log('- Estado de verificación:', driver.verificationStatus);
    
    // Actualizar estado de verificación
    driver.isVerified = true;
    driver.isActive = true;
    driver.verificationStatus = 'approved';
    
    await driver.save();
    
    console.log('\n✅ Chofer verificado exitosamente');
    console.log('- Nuevo estado - Verificado:', driver.isVerified);
    console.log('- Nuevo estado - Activo:', driver.isActive);
    console.log('- Nuevo estado de verificación:', driver.verificationStatus);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

verifyDriver();