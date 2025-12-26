const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createUserInServerDB() {
  try {
    // Conectar a la misma base de datos que usa el servidor
    // Como el servidor está usando fallback en memoria, nos conectamos directamente
    await mongoose.connect('mongodb://127.0.0.1:10420/');
    console.log('✅ Conectado a la base de datos del servidor');

    // Eliminar usuario de prueba existente
    await User.deleteOne({ email: 'test@cliente.com' });
    console.log('🗑️  Usuario existente eliminado');

    // Crear usuario usando el constructor normal
    const testUser = new User({
      name: 'Test Cliente',
      email: 'test@cliente.com',
      password: 'password123',
      role: 'client',
      phone: '+521234567890'
    });

    // Guardar el usuario
    await testUser.save();
    console.log('✅ Usuario creado en la base de datos del servidor');

    // Verificar que el usuario existe
    const savedUser = await User.findOne({ email: 'test@cliente.com' });
    console.log(`📋 Usuario verificado: ${savedUser ? 'Sí' : 'No'}`);

    // Marcar como verificado y activo
    savedUser.isVerified = true;
    savedUser.isActive = true;
    await savedUser.save();
    console.log('✅ Usuario verificado y activado');

    console.log('\n🎉 Usuario de prueba creado en la base de datos del servidor');
    console.log('   Email: test@cliente.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Desconectado de la base de datos');
  }
}

createUserInServerDB();
