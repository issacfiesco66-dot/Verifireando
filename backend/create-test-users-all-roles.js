const mongoose = require('mongoose');
const User = require('./models/User');
const Driver = require('./models/Driver');
require('dotenv').config();

async function createTestUsers() {
  try {
    // Conectar a la misma base de datos que usa el servidor
    await mongoose.connect('mongodb://127.0.0.1:49840/');
    console.log('✅ Conectado a la base de datos del servidor');

    // Eliminar usuarios de prueba existentes
    await User.deleteMany({ 
      email: { $in: ['admin@test.com', 'cliente@test.com'] }
    });
    await Driver.deleteMany({ email: 'chofer@test.com' });
    console.log('🗑️  Usuarios existentes eliminados');

    // 1. Crear usuario Admin
    const adminUser = new User({
      name: 'Administrador Test',
      email: 'admin@test.com',
      phone: '+525512345678',
      password: 'password123',
      role: 'admin',
      isActive: true,
      isVerified: true
    });
    await adminUser.save();
    console.log('✅ Usuario Admin creado: admin@test.com / password123');

    // 2. Crear usuario Client
    const clientUser = new User({
      name: 'Cliente Test',
      email: 'cliente@test.com',
      phone: '+525512345679',
      password: 'password123',
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
    console.log('✅ Usuario Client creado: cliente@test.com / password123');

    // 3. Crear usuario Driver
    const driverUser = new Driver({
      name: 'Chofer Test',
      email: 'chofer@test.com',
      phone: '+525512345680',
      password: 'password123',
      role: 'driver',
      isActive: true,
      isVerified: true,
      licenseNumber: 'LIC' + Date.now().toString().slice(-9),
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
    console.log('✅ Usuario Driver creado: chofer@test.com / password123');

    console.log('\n🎉 Todos los usuarios de prueba creados exitosamente:');
    console.log('\n📋 CREDENCIALES:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ADMINISTRADOR                                    │');
    console.log('│ Email:    admin@test.com                        │');
    console.log('│ Password: password123                           │');
    console.log('│ Rol:      admin                                 │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ CLIENTE                                         │');
    console.log('│ Email:    cliente@test.com                      │');
    console.log('│ Password: password123                           │');
    console.log('│ Rol:      client                                │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ CHOFER                                          │');
    console.log('│ Email:    chofer@test.com                       │');
    console.log('│ Password: password123                           │');
    console.log('│ Rol:      driver                                │');
    console.log('│ Licencia: LIC123456789                         │');
    console.log('│ Vehículo: Toyota Corolla 2022 (ABC123)         │');
    console.log('└─────────────────────────────────────────────────┘');

    // Verificar que los usuarios se crearon correctamente
    const adminCount = await User.countDocuments({ role: 'admin' });
    const clientCount = await User.countDocuments({ role: 'client' });
    const driverCount = await Driver.countDocuments({ role: 'driver' });

    console.log('\n📊 Resumen de usuarios creados:');
    console.log(`• Admins: ${adminCount}`);
    console.log(`• Clients: ${clientCount}`);
    console.log(`• Drivers: ${driverCount}`);

  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Desconectado de la base de datos');
  }
}

createTestUsers();
