const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateUserPreferences() {
  try {
    // Conectar a la base de datos del servidor
    await mongoose.connect('mongodb://127.0.0.1:38886/');
    console.log('✅ Conectado a la base de datos del servidor');

    // Buscar y actualizar el usuario de prueba
    const user = await User.findOne({ email: 'test@cliente.com' });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    // Agregar campo preferences si no existe
    if (!user.preferences) {
      user.preferences = {
        notifications: {
          email: true,
          push: true,
          sms: false,
          appointmentReminders: true,
          statusUpdates: true,
          promotions: false,
          newsletter: false
        },
        privacy: {
          shareLocation: true,
          showOnlineStatus: true,
          allowDataCollection: false,
          marketingEmails: false
        },
        preferences: {
          language: 'es',
          theme: 'light',
          currency: 'MXN',
          timezone: 'America/Mexico_City',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          distanceUnit: 'km'
        }
      };
      
      await user.save();
      console.log('✅ Campo preferences agregado al usuario');
    } else {
      console.log('✅ El usuario ya tiene el campo preferences');
    }

    console.log('\n🎉 Usuario actualizado correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Desconectado de la base de datos');
  }
}

updateUserPreferences();
