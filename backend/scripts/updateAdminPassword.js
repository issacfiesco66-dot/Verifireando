const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function updateAdminPassword() {
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
    
    // Actualizar contraseña
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('✅ Contraseña actualizada exitosamente');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Nueva password:', newPassword);
    
    // Verificar que funciona
    const isValid = await admin.comparePassword(newPassword);
    console.log('✅ Verificación:', isValid);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

updateAdminPassword();