const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkDriverPassword() {
    try {
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Buscar el chofer
        const driver = await Driver.findOne({ email: 'miguel.driver@mail.com' });
        
        if (!driver) {
            console.log('❌ Chofer no encontrado');
            return;
        }

        console.log('🎯 Chofer encontrado:');
        console.log(`- Email: ${driver.email}`);
        console.log(`- Contraseña actual hash: ${driver.password.substring(0, 20)}...`);

        // Probar contraseñas comunes
        const passwords = ['123456', 'password', 'driver123', 'miguel123'];
        
        for (const password of passwords) {
            const isValid = await driver.comparePassword(password);
            console.log(`🔑 Probando "${password}": ${isValid ? '✅' : '❌'}`);
            if (isValid) {
                console.log(`✅ Contraseña correcta encontrada: ${password}`);
                await mongoose.connection.close();
                return;
            }
        }

        // Si no funciona ninguna, actualizar a 123456
        console.log('🔄 Actualizando contraseña a "123456"...');
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('123456', salt);
        
        await Driver.updateOne(
            { email: 'miguel.driver@mail.com' },
            { password: hashedPassword }
        );

        // Verificar la actualización
        const updatedDriver = await Driver.findOne({ email: 'miguel.driver@mail.com' });
        const isValid = await updatedDriver.comparePassword('123456');
        console.log(`✅ Verificación después de actualización: ${isValid}`);

        console.log('🔌 Conexión cerrada');
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDriverPassword();