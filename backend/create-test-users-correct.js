const mongoose = require('mongoose');
const User = require('./models/User');
const Driver = require('./models/Driver');
require('dotenv').config();

async function createTestUsersCorrect() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a la base de datos');

    // Eliminar usuarios de prueba existentes
    await User.deleteMany({ 
      email: { $in: ['admin@test.com', 'cliente@test.com'] }
    });
    await Driver.deleteMany({ email: 'chofer@test.com' });
    console.log('🗑️  Usuarios existentes eliminados');

    // 1. Crear usuario Admin con contraseña 123456
    const adminUser = new User({
      name: 'Administrador Test',
      email: 'admin@test.com',
      phone: '+525512345678',
      password: '123456', // El middleware la hashear automáticamente
      role: 'admin',
      isActive: true,
      isVerified: true
    });
    await adminUser.save();
    console.log('✅ Usuario Admin creado: admin@test.com / 123456');

    // 2. Crear usuario Client con contraseña 123456
    const clientUser = new User({
      name: 'Cliente Test',
      email: 'cliente@test.com',
      phone: '+525512345679',
      password: '123456', // El middleware la hashear automáticamente
      role: 'client',
      isActive: true,
      isVerified: true,
      preferences: {
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
          timezone: 'America/Mexico_City'
        }
      }
    });
    await clientUser.save();
    console.log('✅ Usuario Client creado: cliente@test.com / 123456');

    // 3. Crear usuario Driver con contraseña 123456
    const driverUser = new Driver({
      name: 'Chofer Test',
      email: 'chofer@test.com',
      phone: '+525512345680',
      password: '123456', // El middleware la hashear automáticamente
      role: 'driver',
      isActive: true,
      isVerified: true,
      licenseNumber: 'LIC123456789',
      licenseExpiry: new Date('2025-12-31'),
      vehicleInfo: {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        plates: 'ABC123',
        color: 'Blanco'
      },
      documents: {
        license: 'http://example.com/license.jpg',
        insurance: 'http://example.com/insurance.pdf',
        circulation: 'http://example.com/circulation.pdf'
      },
      isOnline: false,
      rating: 4.5,
      totalTrips: 0
    });
    await driverUser.save();
    console.log('✅ Usuario Driver creado: chofer@test.com / 123456');

    console.log('\n🎉 Todos los usuarios de prueba creados con contraseña 123456');
    console.log('\n📋 CREDENCIALES CORRECTAS:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ADMINISTRADOR                                    │');
    console.log('│ Email:    admin@test.com                        │');
    console.log('│ Password: 123456                                 │');
    console.log('│ Rol:      admin                                 │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ CLIENTE                                         │');
    console.log('│ Email:    cliente@test.com                      │');
    console.log('│ Password: 123456                                 │');
    console.log('│ Rol:      client                                │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ CHOFER                                          │');
    console.log('│ Email:    chofer@test.com                       │');
    console.log('│ Password: 123456                                 │');
    console.log('│ Rol:      driver                                │');
    console.log('└─────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Desconectado de la base de datos');
  }
}

createTestUsersCorrect();
