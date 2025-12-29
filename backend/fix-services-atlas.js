const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://prueba:Chicharito26@verificandoando.iz5eoyu.mongodb.net/verifireando?retryWrites=true&w=majority&appName=Verificandoando';

async function fixServices() {
  try {
    console.log('🔧 CORRIGIENDO SERVICIOS EN ATLAS\n');

    await mongoose.connect(ATLAS_URI);
    console.log('✅ Conectado a Atlas\n');

    const db = mongoose.connection.db;
    const servicesCollection = db.collection('services');

    // Eliminar servicios existentes
    await servicesCollection.deleteMany({});
    console.log('🗑️  Servicios antiguos eliminados\n');

    // Crear servicios con estructura correcta
    const services = [
      {
        name: 'Verificación Vehicular Estándar',
        code: 'verification',
        description: 'Verificación vehicular completa según normativa vigente',
        category: 'verification',
        basePrice: 500,
        driverCommission: 30,
        estimatedDuration: 30,
        isActive: true,
        requirements: ['Tarjeta de circulación', 'Comprobante de domicilio'],
        icon: 'clipboard-check',
        color: '#3B82F6',
        tags: ['verificación', 'obligatorio', 'anual'],
        metadata: {
          popularity: 100,
          averageRating: 4.5,
          totalBookings: 0
        }
      },
      {
        name: 'Lavado Premium',
        code: 'wash',
        description: 'Lavado completo interior y exterior con encerado',
        category: 'cleaning',
        basePrice: 250,
        driverCommission: 40,
        estimatedDuration: 45,
        isActive: true,
        requirements: [],
        icon: 'droplet',
        color: '#06B6D4',
        tags: ['lavado', 'limpieza', 'encerado'],
        metadata: {
          popularity: 80,
          averageRating: 4.7,
          totalBookings: 0
        }
      },
      {
        name: 'Cambio de Aceite',
        code: 'oil_change',
        description: 'Cambio de aceite sintético y filtro',
        category: 'maintenance',
        basePrice: 400,
        driverCommission: 35,
        estimatedDuration: 30,
        isActive: true,
        requirements: ['Manual del vehículo (recomendado)'],
        icon: 'droplet',
        color: '#F59E0B',
        tags: ['mantenimiento', 'aceite', 'filtro'],
        metadata: {
          popularity: 90,
          averageRating: 4.6,
          totalBookings: 0
        }
      },
      {
        name: 'Revisión de Frenos',
        code: 'brake_check',
        description: 'Inspección completa del sistema de frenos',
        category: 'maintenance',
        basePrice: 300,
        driverCommission: 30,
        estimatedDuration: 40,
        isActive: true,
        requirements: [],
        icon: 'disc',
        color: '#EF4444',
        tags: ['frenos', 'seguridad', 'revisión'],
        metadata: {
          popularity: 70,
          averageRating: 4.5,
          totalBookings: 0
        }
      },
      {
        name: 'Cambio de Bujías',
        code: 'spark_plugs',
        description: 'Reemplazo de bujías y revisión del sistema de encendido',
        category: 'maintenance',
        basePrice: 350,
        driverCommission: 35,
        estimatedDuration: 35,
        isActive: true,
        requirements: [],
        icon: 'zap',
        color: '#8B5CF6',
        tags: ['bujías', 'motor', 'encendido'],
        metadata: {
          popularity: 60,
          averageRating: 4.4,
          totalBookings: 0
        }
      }
    ];

    await servicesCollection.insertMany(services);
    console.log(`✅ ${services.length} servicios creados correctamente\n`);

    // Verificar
    const count = await servicesCollection.countDocuments();
    console.log(`📊 Total de servicios en Atlas: ${count}\n`);

    // Mostrar servicios
    const allServices = await servicesCollection.find({}).toArray();
    console.log('📋 Servicios creados:\n');
    allServices.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} - $${s.basePrice}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Servicios corregidos exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixServices();
