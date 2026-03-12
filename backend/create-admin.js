/**
 * Script para crear/actualizar usuario admin en producción.
 * NO borra datos existentes.
 * Uso: node create-admin.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGODB_URI o MONGO_URI no configurada en .env');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const email = 'djonny319@gmail.com';
    const password = 'Chicharito26@';
    const name = 'Admin';

    const existing = await User.findOne({ email });

    if (existing) {
      existing.role = 'admin';
      existing.isVerified = true;
      existing.password = password; // pre-save hook hashea automáticamente
      await existing.save();
      console.log(`✅ Usuario admin actualizado: ${email}`);
    } else {
      await User.create({
        name,
        email,
        phone: '5500000000',
        password, // pre-save hook hashea automáticamente
        role: 'admin',
        isVerified: true
      });
      console.log(`✅ Usuario admin creado: ${email}`);
    }

    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🌐 URL:      https://www.verificandoando.com.mx/admin/dashboard`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
