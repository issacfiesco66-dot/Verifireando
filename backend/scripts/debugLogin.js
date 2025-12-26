const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function debugLogin() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    const email = 'admin@verifireando.com';
    const password = '123456';
    const role = 'admin';

    console.log('\n🔍 Datos de entrada:');
    console.log('- Email:', email);
    console.log('- Password:', password);
    console.log('- Role:', role);

    // Simular el proceso de login
    console.log('\n🔍 Buscando usuario...');
    
    let user;
    if (role === 'admin') {
      user = await User.findOne({ email, role: 'admin' });
      console.log('- Búsqueda: User.findOne({ email: "' + email + '", role: "admin" })');
    } else if (role === 'client') {
      user = await User.findOne({ email, role: 'client' });
      console.log('- Búsqueda: User.findOne({ email: "' + email + '", role: "client" })');
    }

    if (!user) {
      console.log('❌ Usuario no encontrado');
      
      // Buscar sin filtro de rol
      console.log('\n🔍 Buscando usuario sin filtro de rol...');
      const anyUser = await User.findOne({ email });
      if (anyUser) {
        console.log('✅ Usuario encontrado con rol:', anyUser.role);
        console.log('- Nombre:', anyUser.name);
        console.log('- Email:', anyUser.email);
        console.log('- Activo:', anyUser.isActive);
        console.log('- Verificado:', anyUser.isVerified);
      } else {
        console.log('❌ Usuario no encontrado en absoluto');
      }
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log('- ID:', user._id);
    console.log('- Nombre:', user.name);
    console.log('- Email:', user.email);
    console.log('- Rol:', user.role);
    console.log('- Activo:', user.isActive);
    console.log('- Verificado:', user.isVerified);

    // Verificar contraseña
    console.log('\n🔑 Verificando contraseña...');
    const isValidPassword = await user.comparePassword(password);
    console.log('- Contraseña válida:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return;
    }

    // Verificar si está activo
    if (!user.isActive) {
      console.log('❌ Usuario inactivo');
      return;
    }

    // Verificar si está verificado (para clientes)
    if (role === 'client' && !user.isVerified) {
      console.log('❌ Usuario no verificado');
      return;
    }

    console.log('✅ Login exitoso - todos los checks pasaron');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

debugLogin();