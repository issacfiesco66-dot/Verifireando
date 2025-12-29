const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('../models/Driver');

async function testDriverRegistration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Datos de prueba para un conductor
    const testDriverData = {
      name: 'Juan Pérez Conductor',
      email: 'conductor.test@example.com',
      phone: '5551234567',
      password: 'Test123456',
      role: 'driver',
      licenseNumber: 'LIC123456789',
      licenseExpiry: new Date('2026-12-31'),
      vehicleInfo: {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        plates: 'ABC1234',
        color: 'Blanco'
      }
    };

    console.log('\n📝 Intentando crear conductor con los siguientes datos:');
    console.log(JSON.stringify(testDriverData, null, 2));

    // Verificar si ya existe
    const existing = await Driver.findOne({ 
      $or: [
        { email: testDriverData.email },
        { phone: testDriverData.phone },
        { licenseNumber: testDriverData.licenseNumber },
        { 'vehicleInfo.plates': testDriverData.vehicleInfo.plates }
      ]
    });

    if (existing) {
      console.log('\n⚠️  Ya existe un conductor con estos datos. Eliminando...');
      await Driver.deleteOne({ _id: existing._id });
      console.log('✅ Conductor anterior eliminado');
    }

    // Crear conductor
    console.log('\n🔄 Creando conductor...');
    const driver = new Driver(testDriverData);
    
    // Validar antes de guardar
    const validationError = driver.validateSync();
    if (validationError) {
      console.error('❌ Error de validación:', validationError.message);
      console.error('Detalles:', validationError.errors);
      return;
    }

    await driver.save();
    console.log('✅ Conductor creado exitosamente!');
    console.log('ID:', driver._id);
    console.log('Email:', driver.email);
    console.log('Licencia:', driver.licenseNumber);
    console.log('Placas:', driver.vehicleInfo.plates);

    // Verificar que se guardó correctamente
    const savedDriver = await Driver.findById(driver._id);
    console.log('\n✅ Verificación: Conductor encontrado en la base de datos');
    console.log('Nombre:', savedDriver.name);
    console.log('Email:', savedDriver.email);

    // Contar total de drivers
    const totalDrivers = await Driver.countDocuments();
    console.log(`\n📊 Total de conductores en la base de datos: ${totalDrivers}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      console.error('\nDetalles de validación:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('\nStack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

testDriverRegistration();
