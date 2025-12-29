const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const resetAdminPassword = async () => {
  await connectDB();

  try {
    const admin = await User.findOne({ email: 'admin@verifireando.com' });
    
    if (!admin) {
      console.log('❌ Admin no encontrado');
      return;
    }

    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Contraseña actualizada exitosamente');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Nueva password: ${newPassword}`);
    
    // Verificar que funciona
    const isValid = await admin.comparePassword(newPassword);
    console.log(`✅ Verificación: ${isValid}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Conexión cerrada');
    await mongoose.connection.close();
  }
};

resetAdminPassword();