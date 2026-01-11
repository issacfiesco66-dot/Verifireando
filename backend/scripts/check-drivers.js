const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('../models/User');
const Driver = require('../models/Driver');

async function checkDrivers() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI no está configurada');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Buscar choferes en User
    const driversInUser = await User.find({ role: 'driver' });
    console.log(`📋 Choferes en User: ${driversInUser.length}`);
    driversInUser.forEach(d => {
      console.log(`   - ${d.email} | Verified: ${d.isVerified} | Active: ${d.isActive}`);
    });

    // Buscar choferes en Driver
    const driversInDriver = await Driver.find({});
    console.log(`\n📋 Choferes en Driver: ${driversInDriver.length}`);
    driversInDriver.forEach(d => {
      console.log(`   - ${d.email} | License: ${d.licenseNumber} | Verified: ${d.isVerified} | Active: ${d.isActive}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDrivers();
