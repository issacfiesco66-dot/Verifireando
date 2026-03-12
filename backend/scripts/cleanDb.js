/**
 * Script para limpiar la base de datos de desarrollo
 * Uso: node scripts/cleanDb.js
 * Uso (solo usuarios): node scripts/cleanDb.js --users-only
 * Uso (solo citas): node scripts/cleanDb.js --appointments-only
 */
require('dotenv').config();
const mongoose = require('mongoose');
process.env.MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');

const args = process.argv.slice(2);
const usersOnly = args.includes('--users-only');
const appointmentsOnly = args.includes('--appointments-only');

const cleanDatabase = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGODB_URI/MONGO_URI no configurado en .env');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    if (!appointmentsOnly) {
      // Limpiar usuarios (excepto admins)
      const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
      console.log(`🗑️  Usuarios eliminados: ${deletedUsers.deletedCount}`);
      
      // Mostrar admins restantes
      const admins = await User.find({ role: 'admin' }).select('name email');
      if (admins.length > 0) {
        console.log(`👤 Admins preservados:`);
        admins.forEach(a => console.log(`   - ${a.name} (${a.email})`));
      }
    }

    if (!usersOnly) {
      // Limpiar citas
      const deletedAppointments = await Appointment.deleteMany({});
      console.log(`🗑️  Citas eliminadas: ${deletedAppointments.deletedCount}`);
    }

    // También limpiar modelos opcionales si existen
    try {
      const Car = require('../models/Car');
      if (!usersOnly && !appointmentsOnly) {
        const deletedCars = await Car.deleteMany({});
        console.log(`🗑️  Autos eliminados: ${deletedCars.deletedCount}`);
      }
    } catch (e) { /* modelo no existe */ }

    try {
      const Notification = require('../models/Notification');
      if (!usersOnly) {
        const deletedNotifs = await Notification.deleteMany({});
        console.log(`🗑️  Notificaciones eliminadas: ${deletedNotifs.deletedCount}`);
      }
    } catch (e) { /* modelo no existe */ }

    console.log('\n✅ Base de datos limpiada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error.message);
    process.exit(1);
  }
};

// Confirmar en producción
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  ADVERTENCIA: Estás a punto de limpiar la base de datos de PRODUCCIÓN');
  console.log('Escribe "CONFIRMAR" para continuar:');
  process.stdin.once('data', (data) => {
    if (data.toString().trim().toUpperCase() === 'CONFIRMAR') {
      cleanDatabase();
    } else {
      console.log('❌ Operación cancelada');
      process.exit(0);
    }
  });
} else {
  cleanDatabase();
}
