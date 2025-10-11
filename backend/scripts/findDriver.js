const mongoose = require('mongoose');
const Driver = require('../models/Driver');
require('dotenv').config();

async function findDriver() {
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
    
    if (driver) {
      console.log('🎯 Chofer encontrado:');
      console.log('ID:', driver._id);
      console.log('Nombre:', driver.name);
      console.log('Email:', driver.email);
      console.log('Teléfono:', driver.phone);
      console.log('Verificado:', driver.isVerified);
      console.log('Activo:', driver.isActive);
      console.log('Estado de verificación:', driver.verificationStatus);
    } else {
      console.log('❌ No se encontró el chofer Miguel Rodriguez');
      
      // Listar todos los choferes
      const allDrivers = await Driver.find({});
      console.log('\n📋 Todos los choferes en la base de datos:');
      allDrivers.forEach(d => {
        console.log(`- ${d.name} (${d.email}) - Verificado: ${d.isVerified}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

findDriver();