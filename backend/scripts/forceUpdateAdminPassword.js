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

const forceUpdatePassword = async () => {
  await connectDB();

  try {
    const admin = await User.findOne({ email: 'admin@verifireando.com' });
    
    if (!admin) {
      console.log('❌ Admin no encontrado');
      return;
    }

    console.log('🎯 Admin encontrado:');
    console.log(`- Email: ${admin.email}`);
    console.log(`- Contraseña actual hash: ${admin.password.substring(0, 20)}...`);

    const newPassword = '123456';
    console.log(`🔑 Nueva contraseña: ${newPassword}`);
    
    // Hash manual de la contraseña
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log(`🔐 Hash generado: ${hashedPassword.substring(0, 20)}...`);
    
    // Actualizar directamente en la base de datos
    await User.updateOne(
      { email: 'admin@verifireando.com' },
      { $set: { password: hashedPassword } }
    );

    console.log('✅ Contraseña actualizada directamente en BD');
    
    // Verificar que funciona
    const updatedAdmin = await User.findOne({ email: 'admin@verifireando.com' });
    const isValid = await bcrypt.compare(newPassword, updatedAdmin.password);
    console.log(`✅ Verificación manual: ${isValid}`);
    
    const isValidMethod = await updatedAdmin.comparePassword(newPassword);
    console.log(`✅ Verificación con método: ${isValidMethod}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Conexión cerrada');
    await mongoose.connection.close();
  }
};

forceUpdatePassword();