const mongoose = require('mongoose');
const Driver = require('../models/Driver');
require('dotenv').config();

async function checkDrivers() {
    try {
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Buscar todos los choferes
        const drivers = await Driver.find({});
        console.log(`📊 Total de choferes encontrados: ${drivers.length}`);
        
        if (drivers.length > 0) {
            console.log('\n🚗 Lista de choferes:');
            drivers.forEach((driver, index) => {
                console.log(`${index + 1}. Email: ${driver.email}`);
                console.log(`   Nombre: ${driver.name}`);
                console.log(`   Teléfono: ${driver.phone}`);
                console.log(`   Verificado: ${driver.isVerified}`);
                console.log(`   Activo: ${driver.isActive}`);
                console.log(`   ---`);
            });
        } else {
            console.log('❌ No se encontraron choferes en la base de datos');
        }

        console.log('🔌 Conexión cerrada');
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDrivers();