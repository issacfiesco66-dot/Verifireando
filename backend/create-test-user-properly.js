const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createTestUserProperly() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Eliminar usuario de prueba existente
    await User.deleteOne({ email: 'test@cliente.com' });
    console.log('🗑️  Usuario existente eliminado');

    // Crear usuario usando el constructor normal (esto activará el middleware de hash)
    const testUser = new User({
      name: 'Test Cliente',
      email: 'test@cliente.com',
      password: 'password123', // El middleware la hashear automáticamente
      role: 'client',
      phone: '+521234567890'
    });

    // Guardar el usuario (esto ejecutará el middleware de hash)
    await testUser.save();
    console.log('✅ Usuario creado con contraseña hasheada');

    // Verificar que la contraseña se guardó hasheada
    const savedUser = await User.findOne({ email: 'test@cliente.com' });
    console.log(`📋 Contraseña guardada (hash): ${savedUser.password.substring(0, 20)}...`);

    // Probar la comparación de contraseña
    const isValid = await savedUser.comparePassword('password123');
    console.log(`🔐 Comparación de contraseña: ${isValid ? '✅ Válida' : '❌ Inválida'}`);

    // Marcar como verificado y activo
    savedUser.isVerified = true;
    savedUser.isActive = true;
    await savedUser.save();
    console.log('✅ Usuario verificado y activado');

    console.log('\n🎉 Usuario de prueba creado correctamente');
    console.log('   Email: test@cliente.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Desconectado de MongoDB');
  }
}

createTestUserProperly();
