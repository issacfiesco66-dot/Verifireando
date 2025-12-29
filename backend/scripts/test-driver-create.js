const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

async function testDriverCreation() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://prueba:Chicharito26@verificandoando.iz5eoyu.mongodb.net/verifireando?retryWrites=true&w=majority&appName=Verificandoando';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');
    
    // Datos de prueba para conductor
    const testDriver = {
      name: 'Conductor Prueba',
      email: 'conductor.prueba@test.com',
      phone: '5512345678',
      password: await bcrypt.hash('Test123', 10),
      licenseNumber: 'LIC123456',
      licenseExpiry: new Date('2025-12-31'),
      isVerified: true,
      verificationCode: '123456',
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000)
    };
    
    // Eliminar si existe
    await Driver.deleteOne({ email: testDriver.email });
    console.log('🗑️  Conductor anterior eliminado (si existía)');
    
    // Crear nuevo conductor
    const driver = new Driver(testDriver);
    await driver.save();
    
    console.log('\n✅ CONDUCTOR CREADO EXITOSAMENTE');
    console.log('================================');
    console.log('ID:', driver._id);
    console.log('Nombre:', driver.name);
    console.log('Email:', driver.email);
    console.log('Teléfono:', driver.phone);
    console.log('Licencia:', driver.licenseNumber);
    console.log('Vencimiento:', driver.licenseExpiry);
    console.log('VehicleInfo:', driver.vehicleInfo || 'No proporcionado (opcional)');
    console.log('Verificado:', driver.isVerified);
    
    // Verificar en BD
    const found = await Driver.findById(driver._id);
    console.log('\n✅ Verificado en BD:', found ? 'SÍ' : 'NO');
    
    // Contar conductores
    const count = await Driver.countDocuments();
    console.log('📊 Total conductores en BD:', count);
    
    // Mostrar todos los conductores
    const allDrivers = await Driver.find({}, 'name email licenseNumber').limit(10);
    console.log('\n📋 Conductores en la base de datos:');
    allDrivers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.name} - ${d.email} - Lic: ${d.licenseNumber}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testDriverCreation();
