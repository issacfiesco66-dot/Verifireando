const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Driver = require('../models/Driver');

async function createAppointment() {
    try {
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/verifireando');
        console.log('✅ Conectado a MongoDB');

        // Buscar el cliente María González
        const client = await User.findOne({ email: 'maria.gonzalez@mail.com' });
        if (!client) {
            console.log('❌ Cliente María González no encontrado');
            return;
        }

        // Buscar el chofer Miguel Rodriguez
        const driver = await Driver.findOne({ email: 'miguel.driver@mail.com' });
        if (!driver) {
            console.log('❌ Chofer Miguel Rodriguez no encontrado');
            return;
        }

        console.log(`👤 Cliente encontrado: ${client.name} (${client.email})`);
        console.log(`🚗 Chofer encontrado: ${driver.name} (${driver.email})`);

        // Crear nueva cita
        const appointmentData = {
            appointmentNumber: `VER-${Date.now()}`,
            client: client._id,
            status: 'pending',
            scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // En 2 horas
            address: 'Av. Reforma 123, Ciudad de México, CDMX',
            vehicleInfo: {
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                plates: 'ABC-123-XYZ',
                color: 'Blanco'
            },
            price: 500.00,
            notes: 'Verificación vehicular programada'
        };

        const appointment = new Appointment(appointmentData);
        await appointment.save();

        console.log('✅ Cita creada exitosamente:');
        console.log(`📋 ID: ${appointment._id}`);
        console.log(`🔢 Número: ${appointment.appointmentNumber}`);
        console.log(`👤 Cliente: ${client.name}`);
        console.log(`📅 Fecha: ${appointment.scheduledDate}`);
        console.log(`📍 Dirección: ${appointment.address}`);
        console.log(`🚗 Vehículo: ${appointment.vehicleInfo.make} ${appointment.vehicleInfo.model} (${appointment.vehicleInfo.year})`);
        console.log(`💰 Precio: $${appointment.price}`);
        console.log(`📊 Estado: ${appointment.status}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        console.log('🔌 Cerrando conexión...');
        await mongoose.connection.close();
    }
}

createAppointment();