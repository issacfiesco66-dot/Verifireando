const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Driver = require('../models/Driver');
require('dotenv').config();

async function checkDriverPassword() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');
    
    // Buscar al chofer Miguel Rodriguez
    const driver = await Driver.findOne({ 
      $or: [
        { name: /Miguel/i },
        { email: /miguel/i }
      ]
    });
    
    if (!driver) {
      console.log('❌ Chofer no encontrado');
      return;
    }
    
    console.log('🎯 Chofer encontrado:');
    console.log('- Nombre:', driver.name);
    console.log('- Email:', driver.email);
    console.log('- Tiene método comparePassword:', typeof driver.comparePassword === 'function');
    
    // Probar contraseñas comunes
    const testPasswords = ['driver123', 'password123', '123456', 'miguel123'];
    
    for (const password of testPasswords) {
      console.log(`\n🔑 Probando contraseña: ${password}`);
      const isValid = await driver.comparePassword(password);
      console.log(`✅ Resultado: ${isValid}`);
      if (isValid) {
        console.log('🎉 ¡Contraseña correcta encontrada!');
        return;
      }
    }
    
    // Si ninguna funciona, actualizar la contraseña
    console.log('\n🔧 Actualizando contraseña a "driver123"...');
    const newPassword = 'driver123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    driver.password = hashedPassword;
    await driver.save();
    
    console.log('✅ Contraseña actualizada exitosamente');
    
    // Verificar que funciona
    const isValid = await driver.comparePassword(newPassword);
    console.log('✅ Verificación final:', isValid);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

checkDriverPassword();