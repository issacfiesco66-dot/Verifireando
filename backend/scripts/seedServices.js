const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const services = [
  {
    name: 'Verificación Vehicular',
    code: 'verification',
    description: 'Verificación vehicular completa a domicilio con certificado oficial',
    category: 'verification',
    basePrice: 450,
    driverCommission: 30,
    estimatedDuration: 45,
    icon: 'clipboard-check',
    color: '#10B981',
    tags: ['obligatorio', 'certificado', 'oficial'],
    requirements: [
      'Tarjeta de circulación vigente',
      'Póliza de seguro vigente',
      'Identificación oficial del propietario'
    ]
  },
  {
    name: 'Lavado Completo',
    code: 'wash',
    description: 'Lavado exterior e interior completo del vehículo',
    category: 'cleaning',
    basePrice: 150,
    driverCommission: 40,
    estimatedDuration: 60,
    icon: 'droplets',
    color: '#3B82F6',
    tags: ['limpieza', 'estética', 'cuidado'],
    requirements: ['Acceso a agua', 'Espacio para trabajar']
  },
  {
    name: 'Cambio de Aceite',
    code: 'oil_change',
    description: 'Cambio de aceite de motor con filtro incluido',
    category: 'maintenance',
    basePrice: 350,
    driverCommission: 25,
    estimatedDuration: 30,
    icon: 'fuel',
    color: '#F59E0B',
    tags: ['mantenimiento', 'motor', 'preventivo'],
    requirements: ['Aceite específico para el vehículo', 'Filtro de aceite']
  },
  {
    name: 'Cambio de Bujías',
    code: 'spark_plugs',
    description: 'Reemplazo de bujías para mejor rendimiento del motor',
    category: 'maintenance',
    basePrice: 280,
    driverCommission: 30,
    estimatedDuration: 45,
    icon: 'zap',
    color: '#EF4444',
    tags: ['motor', 'rendimiento', 'encendido'],
    requirements: ['Bujías compatibles', 'Herramientas especializadas']
  },
  {
    name: 'Revisión de Frenos',
    code: 'brakes',
    description: 'Inspección y mantenimiento del sistema de frenos',
    category: 'maintenance',
    basePrice: 400,
    driverCommission: 35,
    estimatedDuration: 60,
    icon: 'disc',
    color: '#DC2626',
    tags: ['seguridad', 'frenos', 'preventivo'],
    requirements: ['Acceso a las ruedas', 'Herramientas de frenos']
  },
  {
    name: 'Cambio de Filtro de Aire',
    code: 'air_filter',
    description: 'Reemplazo del filtro de aire del motor',
    category: 'maintenance',
    basePrice: 180,
    driverCommission: 35,
    estimatedDuration: 20,
    icon: 'wind',
    color: '#06B6D4',
    tags: ['filtro', 'aire', 'motor'],
    requirements: ['Filtro de aire compatible']
  },
  {
    name: 'Revisión de Llantas',
    code: 'tire_check',
    description: 'Inspección de llantas, presión y alineación',
    category: 'maintenance',
    basePrice: 120,
    driverCommission: 40,
    estimatedDuration: 30,
    icon: 'circle',
    color: '#374151',
    tags: ['llantas', 'seguridad', 'presión'],
    requirements: ['Medidor de presión', 'Compresor portátil']
  },
  {
    name: 'Revisión de Batería',
    code: 'battery_check',
    description: 'Diagnóstico y mantenimiento de la batería',
    category: 'maintenance',
    basePrice: 100,
    driverCommission: 45,
    estimatedDuration: 25,
    icon: 'battery',
    color: '#16A34A',
    tags: ['batería', 'eléctrico', 'diagnóstico'],
    requirements: ['Multímetro', 'Herramientas básicas']
  },
  {
    name: 'Sistema de Transmisión',
    code: 'transmission',
    description: 'Revisión y mantenimiento del sistema de transmisión',
    category: 'maintenance',
    basePrice: 500,
    driverCommission: 25,
    estimatedDuration: 90,
    icon: 'settings',
    color: '#7C3AED',
    tags: ['transmisión', 'mecánica', 'especializado'],
    requirements: ['Herramientas especializadas', 'Fluidos específicos']
  },
  {
    name: 'Sistema de Enfriamiento',
    code: 'cooling_system',
    description: 'Revisión del radiador y sistema de enfriamiento',
    category: 'maintenance',
    basePrice: 320,
    driverCommission: 30,
    estimatedDuration: 50,
    icon: 'thermometer',
    color: '#0EA5E9',
    tags: ['enfriamiento', 'radiador', 'temperatura'],
    requirements: ['Anticongelante', 'Herramientas de radiador']
  },
  {
    name: 'Sistema Eléctrico',
    code: 'electrical',
    description: 'Diagnóstico y reparación del sistema eléctrico',
    category: 'repair',
    basePrice: 380,
    driverCommission: 35,
    estimatedDuration: 75,
    icon: 'plug',
    color: '#F97316',
    tags: ['eléctrico', 'diagnóstico', 'reparación'],
    requirements: ['Multímetro', 'Herramientas eléctricas']
  },
  {
    name: 'Sistema de Suspensión',
    code: 'suspension',
    description: 'Revisión y ajuste del sistema de suspensión',
    category: 'maintenance',
    basePrice: 450,
    driverCommission: 30,
    estimatedDuration: 80,
    icon: 'move',
    color: '#8B5CF6',
    tags: ['suspensión', 'amortiguadores', 'confort'],
    requirements: ['Herramientas de suspensión', 'Gato hidráulico']
  },
  {
    name: 'Sistema de Escape',
    code: 'exhaust',
    description: 'Inspección y reparación del sistema de escape',
    category: 'repair',
    basePrice: 300,
    driverCommission: 35,
    estimatedDuration: 60,
    icon: 'wind',
    color: '#64748B',
    tags: ['escape', 'emisiones', 'ruido'],
    requirements: ['Herramientas de escape', 'Soldadura portátil']
  },
  {
    name: 'Sistema de Combustible',
    code: 'fuel_system',
    description: 'Limpieza y mantenimiento del sistema de combustible',
    category: 'maintenance',
    basePrice: 250,
    driverCommission: 30,
    estimatedDuration: 40,
    icon: 'fuel',
    color: '#DC2626',
    tags: ['combustible', 'inyectores', 'rendimiento'],
    requirements: ['Limpiador de inyectores', 'Herramientas específicas']
  }
];

async function seedServices() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');

    // Limpiar servicios existentes
    await Service.deleteMany({});
    console.log('🗑️ Servicios existentes eliminados');

    // Insertar nuevos servicios
    const createdServices = await Service.insertMany(services);
    console.log(`✅ ${createdServices.length} servicios creados exitosamente`);

    // Mostrar resumen
    console.log('\n📋 Servicios creados:');
    createdServices.forEach(service => {
      console.log(`- ${service.name} (${service.code}) - $${service.basePrice}`);
    });

    console.log('\n🎉 Seed de servicios completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear servicios:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  seedServices();
}

module.exports = { seedServices, services };