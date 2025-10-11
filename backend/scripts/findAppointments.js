const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

async function findAppointments() {
    try {
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/verifireando');
        console.log('✅ Conectado a MongoDB');

        // Buscar todas las citas
        const appointments = await Appointment.find({}).populate('client', 'name email phone').populate('driver', 'name email phone');
        
        console.log(`📋 Total de citas encontradas: ${appointments.length}`);
        
        if (appointments.length > 0) {
            appointments.forEach((appointment, index) => {
                console.log(`\n--- Cita ${index + 1} ---`);
                console.log(`ID: ${appointment._id}`);
                console.log(`Cliente: ${appointment.client ? appointment.client.name : 'No asignado'} (${appointment.client ? appointment.client.email : 'N/A'})`);
                console.log(`Chofer: ${appointment.driver ? appointment.driver.name : 'No asignado'}`);
                console.log(`Estado: ${appointment.status}`);
                console.log(`Fecha: ${appointment.scheduledDate}`);
                console.log(`Dirección: ${appointment.address}`);
                console.log(`Vehículo: ${appointment.vehicleInfo.make} ${appointment.vehicleInfo.model} (${appointment.vehicleInfo.year})`);
                console.log(`Placas: ${appointment.vehicleInfo.plates}`);
                console.log(`Precio: $${appointment.price}`);
            });
        } else {
            console.log('❌ No se encontraron citas en la base de datos');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        console.log('🔌 Cerrando conexión...');
        await mongoose.connection.close();
    }
}

findAppointments();