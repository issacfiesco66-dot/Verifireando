const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const services = [
  {
    name: 'Verificación Vehicular',
    code: 'verification',
    description: 'Verificación vehicular obligatoria para cumplir con la normativa ambiental',
    category: 'verification',
    basePrice: 500,
    driverCommission: 30,
    estimatedDuration: 30,
    icon: 'check-circle',
    color: '#10B981',
    tags: ['obligatorio', 'ambiental', 'verificación']
  },
  {
    name: 'Lavado Completo',
    code: 'wash',
    description: 'Lavado exterior e interior completo del vehículo',
    category: 'cleaning',
    basePrice: 200,
    driverCommission: 25,
    estimatedDuration: 45,
    icon: 'droplet',
    color: '#3B82F6',
    tags: ['limpieza', 'estética']
  },
  {
    name: 'Cambio de Aceite',
    code: 'oil_change',
    description: 'Cambio de aceite de motor y filtro',
    category: 'maintenance',
    basePrice: 400,
    driverCommission: 30,
    estimatedDuration: 30,
    icon: 'wrench',
    color: '#F59E0B',
    tags: ['mantenimiento', 'motor']
  },
  {
    name: 'Cambio de Bujías',
    code: 'spark_plugs',
    description: 'Reemplazo de bujías de encendido',
    category: 'maintenance',
    basePrice: 350,
    driverCommission: 30,
    estimatedDuration: 45,
    icon: 'zap',
    color: '#EF4444',
    tags: ['mantenimiento', 'motor']
  },
  {
    name: 'Revisión de Frenos',
    code: 'brake_check',
    description: 'Inspección completa del sistema de frenos',
    category: 'maintenance',
    basePrice: 250,
    driverCommission: 25,
    estimatedDuration: 30,
    icon: 'disc',
    color: '#8B5CF6',
    tags: ['seguridad', 'frenos']
  },
  {
    name: 'Cambio de Filtro de Aire',
    code: 'air_filter',
    description: 'Reemplazo del filtro de aire del motor',
    category: 'maintenance',
    basePrice: 200,
    driverCommission: 25,
    estimatedDuration: 20,
    icon: 'wind',
    color: '#06B6D4',
    tags: ['mantenimiento', 'motor']
  }
];

async function seedServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Eliminar servicios existentes
    await Service.deleteMany({});
    console.log('🗑️  Servicios anteriores eliminados');

    // Insertar nuevos servicios
    const createdServices = await Service.insertMany(services);
    console.log(`✅ ${createdServices.length} servicios creados exitosamente`);

    createdServices.forEach(service => {
      console.log(`   - ${service.name} ($${service.basePrice})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedServices();
