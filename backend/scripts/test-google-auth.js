const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function testGoogleAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Simular datos de Google OAuth
    const googleUserData = {
      email: 'test.google@example.com',
      name: 'Usuario Google Test',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user'
    };

    console.log('\n📝 Simulando registro con Google...');
    console.log('Datos:', JSON.stringify(googleUserData, null, 2));

    // Buscar si el usuario ya existe
    let user = await User.findOne({ email: googleUserData.email });

    if (user) {
      console.log('\n⚠️  Usuario ya existe en la base de datos');
      console.log('ID:', user._id);
      console.log('Nombre:', user.name);
      console.log('Email:', user.email);
      console.log('Auth Provider:', user.authProvider);
      console.log('Verificado:', user.isVerified);
      console.log('Última sesión:', user.lastLogin);

      // Actualizar última sesión
      user.lastLogin = new Date();
      if (googleUserData.photoURL && !user.photoURL) {
        user.photoURL = googleUserData.photoURL;
      }
      await user.save();
      console.log('\n✅ Usuario actualizado - LOGIN exitoso');
    } else {
      // Crear nuevo usuario (REGISTRO)
      console.log('\n🆕 Creando nuevo usuario con Google...');
      
      user = new User({
        name: googleUserData.name || googleUserData.email.split('@')[0],
        email: googleUserData.email,
        phone: '+520000000000', // Teléfono por defecto
        password: 'google_oauth_user', // Contraseña placeholder
        role: 'client',
        isActive: true,
        isVerified: true, // ✅ Usuarios de Google ya verificados
        authProvider: 'google',
        photoURL: googleUserData.photoURL || null,
        lastLogin: new Date()
      });

      await user.save();
      console.log('\n✅ Usuario creado exitosamente - REGISTRO completado');
      console.log('ID:', user._id);
      console.log('Nombre:', user.name);
      console.log('Email:', user.email);
      console.log('Auth Provider:', user.authProvider);
      console.log('Verificado:', user.isVerified);
    }

    // Verificar que el usuario esté en la base de datos
    const savedUser = await User.findById(user._id);
    console.log('\n✅ Verificación: Usuario encontrado en MongoDB');
    console.log('Datos completos:', {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      authProvider: savedUser.authProvider,
      isVerified: savedUser.isVerified,
      isActive: savedUser.isActive,
      photoURL: savedUser.photoURL ? 'Sí' : 'No',
      lastLogin: savedUser.lastLogin
    });

    // Contar usuarios de Google
    const googleUsersCount = await User.countDocuments({ authProvider: 'google' });
    console.log(`\n📊 Total de usuarios con Google: ${googleUsersCount}`);

    // Listar todos los usuarios de Google
    const googleUsers = await User.find({ authProvider: 'google' }, 'name email isVerified lastLogin');
    console.log('\n📋 Usuarios registrados con Google:');
    googleUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.name} - ${u.email} - Verificado: ${u.isVerified}`);
    });

    console.log('\n✅ Prueba completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      console.error('\nDetalles de validación:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('\nStack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

testGoogleAuth();
