require('dotenv').config();
const mongoose = require('mongoose');

// Importar modelos
const User = require('../models/User');
const Driver = require('../models/Driver');
const Car = require('../models/Car');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Service = require('../models/Service');
const Coupon = require('../models/Coupon');

// Conectar a MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ ERROR: MONGODB_URI no está configurada');
  console.error('Configura la variable de entorno con tu connection string de Atlas');
  process.exit(1);
}

async function cleanupDatabase() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Obtener conteos antes de eliminar
    const counts = {
      users: await User.countDocuments(),
      drivers: await Driver.countDocuments(),
      cars: await Car.countDocuments(),
      appointments: await Appointment.countDocuments(),
      payments: await Payment.countDocuments(),
      notifications: await Notification.countDocuments(),
      services: await Service.countDocuments(),
      coupons: await Coupon.countDocuments(),
    };

    console.log('📊 Documentos actuales en la base de datos:');
    console.log('  - Usuarios:', counts.users);
    console.log('  - Choferes:', counts.drivers);
    console.log('  - Vehículos:', counts.cars);
    console.log('  - Citas:', counts.appointments);
    console.log('  - Pagos:', counts.payments);
    console.log('  - Notificaciones:', counts.notifications);
    console.log('  - Servicios:', counts.services);
    console.log('  - Cupones:', counts.coupons);
    console.log('');

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      console.log('ℹ️  La base de datos ya está vacía.');
      await mongoose.disconnect();
      return;
    }

    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de las siguientes colecciones:');
    console.log('  - Users (todos los usuarios, incluidos admins)');
    console.log('  - Drivers (todos los choferes)');
    console.log('  - Cars (todos los vehículos)');
    console.log('  - Appointments (todas las citas)');
    console.log('  - Payments (todos los pagos)');
    console.log('  - Notifications (todas las notificaciones)');
    console.log('  - Services (todos los servicios)');
    console.log('  - Coupons (todos los cupones)');
    console.log('');
    console.log('⚠️  Esta acción NO se puede deshacer.\n');

    // En modo no interactivo (desde script), usar variable de entorno
    if (process.env.FORCE_CLEANUP === 'true') {
      console.log('🔧 Modo FORCE_CLEANUP activado, procediendo automáticamente...\n');
    } else {
      console.log('❌ Para ejecutar la limpieza, ejecuta el script con: FORCE_CLEANUP=true node scripts/cleanup-database.js');
      console.log('   O modifica el script para confirmar interactivamente.\n');
      await mongoose.disconnect();
      return;
    }

    console.log('🗑️  Iniciando limpieza...\n');

    // Eliminar en orden (respetando referencias)
    const results = {};

    console.log('   Eliminando citas...');
    results.appointments = await Appointment.deleteMany({});
    console.log(`   ✅ ${results.appointments.deletedCount} citas eliminadas`);

    console.log('   Eliminando pagos...');
    results.payments = await Payment.deleteMany({});
    console.log(`   ✅ ${results.payments.deletedCount} pagos eliminados`);

    console.log('   Eliminando notificaciones...');
    results.notifications = await Notification.deleteMany({});
    console.log(`   ✅ ${results.notifications.deletedCount} notificaciones eliminadas`);

    console.log('   Eliminando vehículos...');
    results.cars = await Car.deleteMany({});
    console.log(`   ✅ ${results.cars.deletedCount} vehículos eliminados`);

    console.log('   Eliminando choferes...');
    results.drivers = await Driver.deleteMany({});
    console.log(`   ✅ ${results.drivers.deletedCount} choferes eliminados`);

    console.log('   Eliminando usuarios...');
    results.users = await User.deleteMany({});
    console.log(`   ✅ ${results.users.deletedCount} usuarios eliminados`);

    console.log('   Eliminando servicios...');
    results.services = await Service.deleteMany({});
    console.log(`   ✅ ${results.services.deletedCount} servicios eliminados`);

    console.log('   Eliminando cupones...');
    results.coupons = await Coupon.deleteMany({});
    console.log(`   ✅ ${results.coupons.deletedCount} cupones eliminados`);

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + (r.deletedCount || 0), 0);

    console.log('\n✅ Limpieza completada exitosamente!');
    console.log(`📊 Total de documentos eliminados: ${totalDeleted}\n`);

    console.log('📋 Resumen:');
    console.log(`   - Usuarios eliminados: ${results.users.deletedCount}`);
    console.log(`   - Choferes eliminados: ${results.drivers.deletedCount}`);
    console.log(`   - Vehículos eliminados: ${results.cars.deletedCount}`);
    console.log(`   - Citas eliminadas: ${results.appointments.deletedCount}`);
    console.log(`   - Pagos eliminados: ${results.payments.deletedCount}`);
    console.log(`   - Notificaciones eliminadas: ${results.notifications.deletedCount}`);
    console.log(`   - Servicios eliminados: ${results.services.deletedCount}`);
    console.log(`   - Cupones eliminados: ${results.coupons.deletedCount}`);
    console.log('');

    console.log('✅ La base de datos está lista para usar desde cero.');
    console.log('   Puedes crear nuevos usuarios, choferes, vehículos y citas.\n');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
cleanupDatabase();
