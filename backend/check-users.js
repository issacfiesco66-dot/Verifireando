const mongoose = require('mongoose');
const User = require('./models/User');
const Driver = require('./models/Driver');
require('dotenv').config();

async function checkUsers() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a la base de datos');

    // Contar usuarios en cada colección
    const userCount = await User.countDocuments();
    const driverCount = await Driver.countDocuments();
    
    console.log(`\n📊 Total de usuarios en colección User: ${userCount}`);
    console.log(`📊 Total de usuarios en colección Driver: ${driverCount}`);

    // Buscar usuarios específicos
    const adminUser = await User.findOne({ email: 'admin@test.com' });
    const clientUser = await User.findOne({ email: 'cliente@test.com' });
    const driverUser = await Driver.findOne({ email: 'chofer@test.com' });

    console.log('\n🔍 Búsqueda de usuarios específicos:');
    console.log(`Admin encontrado: ${adminUser ? 'Sí' : 'No'}`);
    if (adminUser) {
      console.log(`  - ID: ${adminUser._id}`);
      console.log(`  - Role: ${adminUser.role}`);
      console.log(`  - IsActive: ${adminUser.isActive}`);
      console.log(`  - IsVerified: ${adminUser.isVerified}`);
    }

    console.log(`\nCliente encontrado: ${clientUser ? 'Sí' : 'No'}`);
    if (clientUser) {
      console.log(`  - ID: ${clientUser._id}`);
      console.log(`  - Role: ${clientUser.role}`);
      console.log(`  - IsActive: ${clientUser.isActive}`);
      console.log(`  - IsVerified: ${clientUser.isVerified}`);
    }

    console.log(`\nChofer encontrado: ${driverUser ? 'Sí' : 'No'}`);
    if (driverUser) {
      console.log(`  - ID: ${driverUser._id}`);
      console.log(`  - Role: ${driverUser.role}`);
      console.log(`  - IsActive: ${driverUser.isActive}`);
      console.log(`  - IsVerified: ${driverUser.isVerified}`);
    }

    // Listar todos los usuarios en User
    console.log('\n📋 Todos los usuarios en colección User:');
    const allUsers = await User.find({}, { email: 1, role: 1, isActive: 1, isVerified: 1 });
    allUsers.forEach(u => {
      console.log(`  - ${u.email} | Role: ${u.role} | Active: ${u.isActive} | Verified: ${u.isVerified}`);
    });

    // Listar todos los drivers
    console.log('\n📋 Todos los usuarios en colección Driver:');
    const allDrivers = await Driver.find({}, { email: 1, role: 1, isActive: 1, isVerified: 1 });
    allDrivers.forEach(d => {
      console.log(`  - ${d.email} | Role: ${d.role} | Active: ${d.isActive} | Verified: ${d.isVerified}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Desconectado de la base de datos');
  }
}

checkUsers();
