/**
 * Script para agregar servicios de ejemplo a la base de datos
 * Ejecutar con: node scripts/add-sample-services.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Importar el modelo de servicio
const Service = require('../models/Service');

// Conectar a MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ ERROR: MONGODB_URI no está configurada');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
  addSampleServices();
})
.catch((error) => {
  console.error('❌ Error conectando a MongoDB Atlas:', error.message);
  process.exit(1);
});

// Servicios de ejemplo
const sampleServices = [
  {
    name: 'Verificación Vehicular',
    code: 'verification',
    description: 'Servicio de verificación vehicular oficial. Incluye prueba de emisiones y revisión básica.',
    category: 'verification',
    basePrice: 800,
    driverCommission: 30,
    estimatedDuration: 120, // 2 horas
    isActive: true,
    requirements: [
      { type: 'document', description: 'Tarjeta de circulación vigente' },
      { type: 'document', description: 'Identificación oficial del propietario' }
    ],
    icon: 'check-circle',
    color: '#10B981',
    tags: ['verificación', 'oficial', 'emisiones']
  },
  {
    name: 'Lavado Completo',
    code: 'wash',
    description: 'Lavado exterior e interior del vehículo. Incluye aspirado, limpieza de tablero y cristales.',
    category: 'cleaning',
    basePrice: 350,
    driverCommission: 40,
    estimatedDuration: 60, // 1 hora
    isActive: true,
    icon: 'droplet',
    color: '#3B82F6',
    tags: ['lavado', 'limpieza', 'interior', 'exterior']
  },
  {
    name: 'Cambio de Aceite',
    code: 'oil_change',
    description: 'Cambio de aceite y filtro. Incluye revisión de niveles.',
    category: 'maintenance',
    basePrice: 650,
    driverCommission: 25,
    estimatedDuration: 45, // 45 minutos
    isActive: true,
    icon: 'oil-can',
    color: '#F59E0B',
    tags: ['aceite', 'mantenimiento', 'filtro']
  },
  {
    name: 'Revisión de Frenos',
    code: 'brake_check',
    description: 'Revisión completa del sistema de frenos. Incluye diagnóstico y recomendaciones.',
    category: 'maintenance',
    basePrice: 400,
    driverCommission: 30,
    estimatedDuration: 60, // 1 hora
    isActive: true,
    icon: 'brake-warning',
    color: '#EF4444',
    tags: ['frenos', 'seguridad', 'mantenimiento']
  },
  {
    name: 'Revisión de Batería',
    code: 'battery_check',
    description: 'Diagnóstico del estado de la batería y sistema eléctrico.',
    category: 'maintenance',
    basePrice: 250,
    driverCommission: 35,
    estimatedDuration: 30, // 30 minutos
    isActive: true,
    icon: 'battery-full',
    color: '#6366F1',
    tags: ['batería', 'eléctrico', 'diagnóstico']
  }
];

// Función para agregar servicios
async function addSampleServices() {
  try {
    // Eliminar servicios existentes (opcional)
    await Service.deleteMany({});
    console.log('🗑️ Servicios existentes eliminados');

    // Agregar nuevos servicios
    const result = await Service.insertMany(sampleServices);
    console.log(`✅ ${result.length} servicios agregados correctamente`);
    
    // Mostrar los servicios agregados
    console.log('\nServicios agregados:');
    result.forEach(service => {
      console.log(`- ${service.name} (${service.code}): $${service.basePrice}`);
    });

    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('\n👋 Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar servicios:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}
