const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAndCleanUsers() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Verificar usuarios existentes
    const users = await User.find({});
    console.log('\n📋 Usuarios existentes:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Verified: ${user.isVerified}, Active: ${user.isActive}`);
    });

    // Eliminar usuarios de prueba conflictivos
    const testEmails = ['test@cliente.com', 'juan@cliente.com', 'admin@test.com', 'cliente@test.com'];
    
    for (const email of testEmails) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        await User.deleteOne({ email });
        console.log(`🗑️  Eliminado usuario: ${email}`);
      }
    }

    // Crear usuario de prueba limpio
    const testUser = {
      name: 'Test Cliente',
      email: 'test@cliente.com',
      password: 'password123',
      role: 'client',
      isVerified: true,
      isActive: true,
      phone: '+521234567890'
    };

    const newUser = new User(testUser);
    await newUser.save();
    console.log(`✅ Usuario de prueba creado: ${testUser.email}`);

    // Crear usuario admin de prueba
    const adminUser = {
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      isActive: true,
      phone: '+521234567891'
    };

    const newAdmin = new User(adminUser);
    await newAdmin.save();
    console.log(`✅ Admin de prueba creado: ${adminUser.email}`);

    console.log('\n🎉 Base de datos limpiada y usuarios de prueba creados');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Desconectado de MongoDB');
  }
}

checkAndCleanUsers();
