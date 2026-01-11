const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Car = require('../models/Car');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');

async function cleanDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI no está configurada');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Find admin user(s)
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      console.error('❌ ERROR: No se encontró ningún usuario admin en la base de datos');
      console.error('   Por favor, crea un usuario admin antes de ejecutar este script');
      process.exit(1);
    }

    console.log(`📋 Usuarios admin encontrados: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    console.log('');

    const adminIds = adminUsers.map(admin => admin._id);

    // Delete all non-admin users
    const deletedUsers = await User.deleteMany({ 
      role: { $ne: 'admin' } 
    });
    console.log(`🗑️  Usuarios eliminados (excepto admin): ${deletedUsers.deletedCount}`);

    // Delete all appointments
    const deletedAppointments = await Appointment.deleteMany({});
    console.log(`🗑️  Citas eliminadas: ${deletedAppointments.deletedCount}`);

    // Delete all cars
    const deletedCars = await Car.deleteMany({});
    console.log(`🗑️  Vehículos eliminados: ${deletedCars.deletedCount}`);

    // Delete all notifications
    const deletedNotifications = await Notification.deleteMany({});
    console.log(`🗑️  Notificaciones eliminadas: ${deletedNotifications.deletedCount}`);

    // Delete all payments
    const deletedPayments = await Payment.deleteMany({});
    console.log(`🗑️  Pagos eliminados: ${deletedPayments.deletedCount}`);

    // Keep services (they are needed for the application to work)
    const serviceCount = await Service.countDocuments({});
    console.log(`📦 Servicios mantenidos: ${serviceCount}`);

    console.log('\n✅ Base de datos limpiada exitosamente');
    console.log(`   Se mantuvieron ${adminUsers.length} usuario(s) admin`);
    console.log(`   Se mantuvieron ${serviceCount} servicio(s)`);

  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Run the script
cleanDatabase();
