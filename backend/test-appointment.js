const mongoose = require('mongoose');
require('dotenv').config();

// Datos de prueba para crear una cita
const testAppointmentData = {
  car: '657a7f7d1234567890123463', // ID del auto de Juan
  scheduledDate: new Date('2025-01-20'),
  scheduledTime: '10:00',
  services: {
    verification: true,
    additionalServices: [
      {
        name: 'wash',
        price: 150
      }
    ]
  },
  pickupAddress: {
    street: 'Av. Insurgentes Sur 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '06700',
    coordinates: {
      lat: 19.4326,
      lng: -99.1332
    }
  },
  deliveryAddress: {
    street: 'Av. Insurgentes Sur 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '06700',
    coordinates: {
      lat: 19.4326,
      lng: -99.1332
    }
  },
  notes: 'Prueba de cita',
  preferredDriver: null
};

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Configurada' : 'NO configurada');
    
    // Intentar conectar
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');
    console.log('📊 Base de datos:', mongoose.connection.name);
    
    // Verificar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Colecciones disponibles:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Verificar usuarios
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`\n👥 Usuarios en DB: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().limit(3).select('name email role');
      console.log('Usuarios:');
      users.forEach(u => console.log(`  - ${u.name} (${u.email}) - ${u.role}`));
    }
    
    // Verificar autos
    const Car = require('./models/Car');
    const carCount = await Car.countDocuments();
    console.log(`\n🚗 Autos en DB: ${carCount}`);
    
    if (carCount > 0) {
      const cars = await Car.find().limit(3).populate('owner', 'name email');
      console.log('Autos:');
      cars.forEach(c => console.log(`  - ${c.plates} (${c.brand} ${c.model}) - Dueño: ${c.owner?.name}`));
    }
    
    // Verificar servicios
    const Service = require('./models/Service');
    const serviceCount = await Service.countDocuments();
    console.log(`\n🔧 Servicios en DB: ${serviceCount}`);
    
    // Probar validación de esquema de cita
    console.log('\n🧪 Probando validación de datos de cita...');
    const Joi = require('joi');
    
    const createAppointmentSchema = Joi.object({
      car: Joi.string().required(),
      scheduledDate: Joi.date().required(),
      scheduledTime: Joi.string().required().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      services: Joi.object({
        verification: Joi.boolean().default(true),
        additionalServices: Joi.array().items(
          Joi.object({
            name: Joi.string().valid(
              'wash', 'oil_change', 'spark_plugs', 'brakes', 'air_filter', 
              'tire_check', 'battery_check', 'brake_check', 'transmission', 
              'cooling_system', 'electrical', 'suspension', 'exhaust', 'fuel_system'
            ).required(),
            price: Joi.number().min(0).required()
          })
        ).default([])
      }).required(),
      pickupAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().min(-90).max(90).required(),
          lng: Joi.number().min(-180).max(180).required()
        }).required()
      }).required(),
      deliveryAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().min(-90).max(90).required(),
          lng: Joi.number().min(-180).max(180).required()
        }).required()
      }).required(),
      notes: Joi.string().max(500).allow(''),
      preferredDriver: Joi.string().allow(null)
    });
    
    const { error, value } = createAppointmentSchema.validate(testAppointmentData);
    
    if (error) {
      console.log('❌ Error de validación:');
      error.details.forEach(d => {
        console.log(`  - Campo: ${d.path.join('.')}`);
        console.log(`    Error: ${d.message}`);
      });
    } else {
      console.log('✅ Datos de prueba válidos');
      console.log('\n📝 Datos validados:');
      console.log(JSON.stringify(value, null, 2));
    }
    
    console.log('\n✅ Todas las verificaciones completadas');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('💡 No se puede conectar a MongoDB Atlas. Verifica:');
      console.error('   1. La URI de conexión es correcta');
      console.error('   2. Tu IP está en la lista blanca de MongoDB Atlas');
      console.error('   3. Las credenciales son correctas');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Conexión cerrada');
    process.exit(0);
  }
}

testConnection();
