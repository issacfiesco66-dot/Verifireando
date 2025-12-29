const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function fixAdminUser() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Buscar el usuario admin
    const admin = await User.findOne({ email: 'admin@verifireando.com' });
    
    if (!admin) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }

    console.log('🎯 Admin encontrado:');
    console.log('- ID:', admin._id);
    console.log('- Nombre:', admin.name);
    console.log('- Email:', admin.email);
    console.log('- Rol:', admin.role);
    console.log('- Activo:', admin.isActive);
    console.log('- Verificado:', admin.isVerified);

    // Actualizar los datos del admin si es necesario
    let needsUpdate = false;
    
    if (!admin.name || admin.name === 'undefined undefined') {
      admin.name = 'Administrador';
      needsUpdate = true;
      console.log('🔧 Corrigiendo nombre del admin...');
    }

    if (!admin.isActive) {
      admin.isActive = true;
      needsUpdate = true;
      console.log('🔧 Activando cuenta del admin...');
    }

    if (!admin.isVerified) {
      admin.isVerified = true;
      needsUpdate = true;
      console.log('🔧 Verificando cuenta del admin...');
    }

    if (admin.role !== 'admin') {
      admin.role = 'admin';
      needsUpdate = true;
      console.log('🔧 Corrigiendo rol del admin...');
    }

    if (!admin.phone) {
      admin.phone = '5555555555';
      needsUpdate = true;
      console.log('🔧 Agregando teléfono al admin...');
    }

    if (needsUpdate) {
      await admin.save();
      console.log('✅ Usuario admin actualizado correctamente');
    } else {
      console.log('✅ Usuario admin ya está configurado correctamente');
    }

    // Verificar la contraseña
    console.log('\n🔑 Verificando contraseña...');
    const isPasswordValid = await admin.comparePassword('123456');
    console.log('Contraseña "123456" válida:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('🔧 Actualizando contraseña...');
      admin.password = '123456';
      await admin.save();
      console.log('✅ Contraseña actualizada');
    }

    console.log('\n🎉 Usuario admin configurado correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

fixAdminUser();