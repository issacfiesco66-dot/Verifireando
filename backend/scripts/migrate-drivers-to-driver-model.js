const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('../models/User');
const Driver = require('../models/Driver');

async function migrateDrivers() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI no está configurada');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Buscar todos los usuarios con role='driver' en el modelo User
    const driversInUser = await User.find({ role: 'driver' });
    console.log(`📋 Choferes encontrados en User: ${driversInUser.length}\n`);

    if (driversInUser.length === 0) {
      console.log('✅ No hay choferes para migrar');
      await mongoose.connection.close();
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDriver of driversInUser) {
      try {
        // Verificar si ya existe en Driver
        const existingDriver = await Driver.findOne({ 
          $or: [{ email: userDriver.email }, { phone: userDriver.phone }] 
        });

        if (existingDriver) {
          console.log(`⚠️  Chofer ya existe en Driver: ${userDriver.email} - Omitiendo`);
          skipped++;
          continue;
        }

        // Crear nuevo Driver desde User
        const driverData = {
          name: userDriver.name,
          email: userDriver.email,
          phone: userDriver.phone,
          password: userDriver.password, // Mantener la contraseña hasheada
          role: 'driver',
          licenseNumber: userDriver.driverProfile?.licenseNumber || `MIGRATED_${userDriver._id}`,
          licenseExpiry: userDriver.driverProfile?.licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año desde ahora
          vehicleInfo: userDriver.driverProfile?.vehicleInfo || {},
          isActive: userDriver.isActive !== false,
          isAvailable: userDriver.isAvailable || false,
          isOnline: userDriver.isOnline || false,
          isVerified: userDriver.isVerified || false,
          verificationStatus: userDriver.isVerified ? 'approved' : 'pending',
          rating: {
            average: userDriver.driverProfile?.rating || 0,
            count: userDriver.driverProfile?.totalTrips || 0
          },
          completedTrips: userDriver.driverProfile?.totalTrips || 0,
          location: userDriver.location || {
            type: 'Point',
            coordinates: [0, 0]
          },
          lastLocationUpdate: userDriver.driverProfile?.currentLocation?.lastUpdate || new Date(),
          fcmToken: userDriver.fcmToken,
          pushSubscription: userDriver.pushSubscription,
          userAgent: userDriver.userAgent,
          lastPushSubscriptionUpdate: userDriver.lastPushSubscriptionUpdate,
          verificationCode: userDriver.verificationCode,
          verificationCodeExpires: userDriver.verificationCodeExpires
        };

        const newDriver = new Driver(driverData);
        await newDriver.save();

        console.log(`✅ Migrado: ${userDriver.email} -> Driver`);
        migrated++;

        // Opcional: Eliminar del modelo User (descomentar si quieres eliminar)
        // await User.findByIdAndDelete(userDriver._id);
        // console.log(`🗑️  Eliminado de User: ${userDriver.email}`);

      } catch (error) {
        console.error(`❌ Error migrando ${userDriver.email}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Resumen de migración:`);
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⚠️  Omitidos (ya existían): ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);

    await mongoose.connection.close();
    console.log('\n✅ Migración completada');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrateDrivers();
