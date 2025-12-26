const mongoose = require('mongoose');
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

const checkAdminPassword = async () => {
  await connectDB();

  try {
    const admin = await User.findOne({ email: 'admin@verifireando.com' });
    
    if (!admin) {
      console.log('❌ Admin no encontrado');
      return;
    }

    console.log('🎯 Admin encontrado:');
    console.log(`- Nombre: ${admin.firstName} ${admin.lastName}`);
    console.log(`- Email: ${admin.email}`);

    const passwords = ['123456', 'admin123', 'password', 'password123', 'admin', 'verifireando123'];
    
    for (const password of passwords) {
      console.log(`\n🔑 Probando contraseña: ${password}`);
      const isValid = await admin.comparePassword(password);
      console.log(`✅ Resultado: ${isValid}`);
      
      if (isValid) {
        console.log('🎉 ¡Contraseña correcta encontrada!');
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Conexión cerrada');
    await mongoose.connection.close();
  }
};

checkAdminPassword();