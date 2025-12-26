const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function verifyTestUser() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Verificar y activar el usuario de prueba
    const testUser = await User.findOne({ email: 'test@cliente.com' });
    
    if (testUser) {
      testUser.isVerified = true;
      testUser.isActive = true;
      testUser.verificationCode = undefined;
      testUser.verificationCodeExpires = undefined;
      await testUser.save();
      console.log(`✅ Usuario verificado: ${testUser.email}`);
      console.log(`   - Verificado: ${testUser.isVerified}`);
      console.log(`   - Activo: ${testUser.isActive}`);
    } else {
      console.log('❌ Usuario de prueba no encontrado');
    }

    // Verificar y activar el admin de prueba
    const adminUser = await User.findOne({ email: 'admin@test.com' });
    
    if (adminUser) {
      adminUser.isVerified = true;
      adminUser.isActive = true;
      adminUser.verificationCode = undefined;
      adminUser.verificationCodeExpires = undefined;
      await adminUser.save();
      console.log(`✅ Admin verificado: ${adminUser.email}`);
      console.log(`   - Verificado: ${adminUser.isVerified}`);
      console.log(`   - Activo: ${adminUser.isActive}`);
    }

    console.log('\n🎉 Usuarios verificados correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Desconectado de MongoDB');
  }
}

verifyTestUser();
