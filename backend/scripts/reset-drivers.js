const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('../models/Driver');

async function resetDriversCollection() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Contar drivers existentes
    const count = await Driver.countDocuments();
    console.log(`📊 Drivers existentes: ${count}`);

    // Listar drivers
    if (count > 0) {
      const drivers = await Driver.find({}, 'name email phone licenseNumber vehicleInfo.plates');
      console.log('\n📋 Drivers en la base de datos:');
      drivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name} - ${driver.email} - ${driver.phone}`);
        console.log(`   Licencia: ${driver.licenseNumber}`);
        console.log(`   Placas: ${driver.vehicleInfo?.plates || 'N/A'}`);
      });
    }

    // Verificar índices
    console.log('\n🔍 Verificando índices...');
    const indexes = await Driver.collection.getIndexes();
    console.log('Índices actuales:', Object.keys(indexes));

    // Opción para limpiar (comentar/descomentar según necesidad)
    // console.log('\n🗑️  Limpiando colección de drivers...');
    // await Driver.deleteMany({});
    // console.log('✅ Colección limpiada');

    // Verificar que el modelo tenga todos los campos requeridos
    console.log('\n📝 Campos requeridos del modelo Driver:');
    const schema = Driver.schema.obj;
    Object.keys(schema).forEach(key => {
      const field = schema[key];
      if (field.required || (field.type && field.required)) {
        console.log(`  - ${key}: ${field.required ? 'REQUERIDO' : 'opcional'}`);
      }
    });

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

resetDriversCollection();
