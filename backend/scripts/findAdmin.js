const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function findAdmin() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');
    
    // Buscar usuarios admin
    const admins = await User.find({ role: 'admin' });
    
    if (admins.length > 0) {
      console.log('👑 Usuarios admin encontrados:');
      admins.forEach(admin => {
        console.log(`- ${admin.name} (${admin.email}) - Verificado: ${admin.isVerified}`);
      });
    } else {
      console.log('❌ No se encontraron usuarios admin');
      
      // Listar todos los usuarios
      const allUsers = await User.find({});
      console.log('\n📋 Todos los usuarios en la base de datos:');
      allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email}) - Rol: ${u.role} - Verificado: ${u.isVerified}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

findAdmin();