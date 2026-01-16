const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Car = require('./models/Car');
const Appointment = require('./models/Appointment');
const Notification = require('./models/Notification');

async function cleanDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI no está configurada');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conectado a MongoDB Atlas');

    console.log('\n🗑️  Limpiando base de datos...\n');

    // Eliminar usuarios de prueba (excepto admin si existe)
    const deletedUsers = await User.deleteMany({
      email: { $regex: /test\.com$|prueba\.com$/i }
    });
    console.log(`✓ Usuarios eliminados: ${deletedUsers.deletedCount}`);

    // Eliminar todos los vehículos
    const deletedCars = await Car.deleteMany({});
    console.log(`✓ Vehículos eliminados: ${deletedCars.deletedCount}`);

    // Eliminar todas las citas
    const deletedAppointments = await Appointment.deleteMany({});
    console.log(`✓ Citas eliminadas: ${deletedAppointments.deletedCount}`);

    // Eliminar todas las notificaciones
    const deletedNotifications = await Notification.deleteMany({});
    console.log(`✓ Notificaciones eliminadas: ${deletedNotifications.deletedCount}`);

    console.log('\n✅ Base de datos limpiada exitosamente');
    
    // Mostrar estadísticas finales
    const userCount = await User.countDocuments();
    const carCount = await Car.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    const notificationCount = await Notification.countDocuments();

    console.log('\n📊 Estado actual de la base de datos:');
    console.log(`   - Usuarios: ${userCount}`);
    console.log(`   - Vehículos: ${carCount}`);
    console.log(`   - Citas: ${appointmentCount}`);
    console.log(`   - Notificaciones: ${notificationCount}`);

    await mongoose.connection.close();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    process.exit(1);
  }
}

cleanDatabase();
