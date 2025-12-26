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

const checkAndUpdateAdmin = async () => {
  await connectDB();

  try {
    const admin = await User.findOne({ email: 'admin@verifireando.com' });
    
    if (!admin) {
      console.log('❌ Admin no encontrado');
      return;
    }

    console.log('🎯 Admin encontrado:');
    console.log(`- Nombre: ${admin.name}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Rol actual: ${admin.role}`);
    console.log(`- Verificado: ${admin.isVerified}`);
    console.log(`- Activo: ${admin.isActive}`);

    // Actualizar rol a admin si no lo es
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      admin.isVerified = true;
      admin.isActive = true;
      await admin.save();
      console.log('✅ Rol actualizado a admin');
    } else {
      console.log('✅ El rol ya es admin');
    }

    // Verificar contraseña
    const isValid = await admin.comparePassword('123456');
    console.log(`🔑 Contraseña 123456 válida: ${isValid}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Conexión cerrada');
    await mongoose.connection.close();
  }
};

checkAndUpdateAdmin();