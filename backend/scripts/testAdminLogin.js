const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function testAdminLogin() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');
    
    // Buscar admin
    const admin = await User.findOne({ email: 'admin@verifireando.com' });
    
    if (!admin) {
      console.log('❌ Admin no encontrado');
      return;
    }
    
    console.log('👑 Admin encontrado:');
    console.log('- Nombre:', admin.name);
    console.log('- Email:', admin.email);
    console.log('- Rol:', admin.role);
    console.log('- Verificado:', admin.isVerified);
    console.log('- Activo:', admin.isActive);
    console.log('- Tiene método comparePassword:', typeof admin.comparePassword === 'function');
    
    // Probar contraseña
    const testPassword = 'admin123';
    console.log('\n🔑 Probando contraseña:', testPassword);
    
    if (typeof admin.comparePassword === 'function') {
      const isValid = await admin.comparePassword(testPassword);
      console.log('✅ Resultado comparePassword:', isValid);
    } else {
      // Comparar manualmente
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log('✅ Resultado bcrypt.compare:', isValid);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

testAdminLogin();