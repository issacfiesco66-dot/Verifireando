const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Driver = require('../models/Driver');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetDriverPasswords() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI no está configurada');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Buscar todos los choferes
    const drivers = await Driver.find({});
    console.log(`📋 Choferes encontrados: ${drivers.length}\n`);

    if (drivers.length === 0) {
      console.log('✅ No hay choferes para resetear');
      await mongoose.connection.close();
      rl.close();
      return;
    }

    // Mostrar lista de choferes
    drivers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.email} - ${d.name}`);
    });

    console.log('\n⚠️  ADVERTENCIA: Esto reseteará las contraseñas de TODOS los choferes a "password123"');
    const confirm = await question('\n¿Continuar? (escribe "SI" para confirmar): ');

    if (confirm !== 'SI') {
      console.log('❌ Operación cancelada');
      await mongoose.connection.close();
      rl.close();
      return;
    }

    const newPassword = 'password123';
    let updated = 0;

    for (const driver of drivers) {
      try {
        driver.password = newPassword; // Se hasheará automáticamente por el middleware
        await driver.save();
        console.log(`✅ Contraseña reseteada para: ${driver.email}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error reseteando ${driver.email}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Contraseñas reseteadas: ${updated}/${drivers.length}`);
    console.log(`   🔑 Nueva contraseña para todos: ${newPassword}`);

    await mongoose.connection.close();
    rl.close();
    console.log('\n✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

resetDriverPasswords();
