const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function debugLogin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    const email = 'test@cliente.com';
    const password = 'password123';

    // Buscar usuario como lo hace el backend
    console.log('\n🔍 Buscando usuario...');
    const user = await User.findOne({ email, role: 'client' });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Verified: ${user.isVerified}`);
    console.log(`   - Active: ${user.isActive}`);

    // Probar comparación de contraseña
    console.log('\n🔐 Probando contraseña...');
    const isValidPassword = await user.comparePassword(password);
    console.log(`   - Contraseña válida: ${isValidPassword}`);

    // Verificar estado de la cuenta
    console.log('\n📋 Verificando estado de la cuenta...');
    console.log(`   - Activo: ${user.isActive}`);
    console.log(`   - Verificado: ${user.isVerified}`);

    if (!user.isActive) {
      console.log('❌ Cuenta desactivada');
      return;
    }

    if (!user.isVerified) {
      console.log('❌ Cuenta no verificada');
      return;
    }

    console.log('\n✅ Todas las validaciones pasaron - El login debería funcionar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Desconectado de MongoDB');
  }
}

debugLogin();
