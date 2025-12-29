const mongoose = require('mongoose');
require('dotenv').config();

async function migrateDrivers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB\n');

    const usersCollection = mongoose.connection.db.collection('users');
    const driversCollection = mongoose.connection.db.collection('drivers');

    // Obtener todos los drivers de la tabla antigua
    const drivers = await driversCollection.find({}).toArray();
    
    if (drivers.length === 0) {
      console.log('✅ No hay conductores para migrar');
      await mongoose.connection.close();
      return;
    }

    console.log(`📦 Encontrados ${drivers.length} conductores para migrar\n`);

    let migrated = 0;
    let skipped = 0;

    for (const driver of drivers) {
      // Verificar si ya existe en users
      const existingUser = await usersCollection.findOne({ email: driver.email });
      
      if (existingUser) {
        console.log(`⚠️  Saltando ${driver.email} - Ya existe en users`);
        skipped++;
        continue;
      }

      // Preparar documento para users
      const userData = {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        password: driver.password,
        role: 'driver',
        isVerified: driver.isVerified || false,
        verificationCode: driver.verificationCode,
        verificationCodeExpires: driver.verificationCodeExpires,
        isActive: driver.isActive !== undefined ? driver.isActive : true,
        authProvider: driver.authProvider || 'local',
        photoURL: driver.photoURL || null,
        lastLogin: driver.lastLogin || null,
        createdAt: driver.createdAt || new Date(),
        updatedAt: driver.updatedAt || new Date(),
        driverProfile: {
          licenseNumber: driver.licenseNumber,
          licenseExpiry: driver.licenseExpiry,
          licenseDocument: driver.licenseDocument,
          isVerifiedDriver: driver.isVerifiedDriver || false,
          vehicleInfo: driver.vehicleInfo || {},
          rating: driver.rating?.average || 0,
          totalTrips: driver.totalTrips || 0,
          isOnline: driver.isOnline || false,
          isAvailable: driver.isAvailable || false,
          currentLocation: driver.currentLocation || {}
        }
      };

      // Insertar en users
      await usersCollection.insertOne(userData);
      console.log(`✅ Migrado: ${driver.email}`);
      migrated++;
    }

    console.log(`\n📊 RESUMEN DE MIGRACIÓN:`);
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⚠️  Saltados: ${skipped}`);
    console.log(`   📦 Total: ${drivers.length}`);

    // Eliminar la colección drivers antigua
    console.log('\n🗑️  Eliminando colección "drivers" antigua...');
    await driversCollection.drop();
    console.log('✅ Colección "drivers" eliminada');

    await mongoose.connection.close();
    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrateDrivers();
