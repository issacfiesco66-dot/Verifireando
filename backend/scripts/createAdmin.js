const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ email: 'admin@verifireando.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin ya existe:', existingAdmin.email);
      return;
    }
    
    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new User({
      name: 'Administrador',
      email: 'admin@verifireando.com',
      phone: '+525551234500',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    
    await admin.save();
    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

createAdmin();