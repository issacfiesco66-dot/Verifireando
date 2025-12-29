const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Crear servicios de verificación
    console.log('1️⃣  Creando servicios de verificación...\n');
    
    const services = [
      {
        name: 'Verificación Vehicular Estándar',
        description: 'Verificación vehicular completa según normativa vigente',
        category: 'verification',
        price: 500,
        duration: 30,
        isActive: true,
        isPopular: true,
        features: ['Revisión de emisiones', 'Inspección visual', 'Certificado digital']
      },
      {
        name: 'Verificación Express',
        description: 'Verificación rápida en tu domicilio',
        category: 'verification',
        price: 700,
        duration: 20,
        isActive: true,
        isPopular: true,
        features: ['Servicio a domicilio', 'Sin filas', 'Certificado inmediato']
      },
      {
        name: 'Lavado Básico',
        description: 'Lavado exterior del vehículo',
        category: 'wash',
        price: 100,
        duration: 15,
        isActive: true,
        isPopular: false,
        features: ['Lavado exterior', 'Secado', 'Aspirado básico']
      },
      {
        name: 'Lavado Premium',
        description: 'Lavado completo interior y exterior',
        category: 'wash',
        price: 250,
        duration: 45,
        isActive: true,
        isPopular: true,
        features: ['Lavado completo', 'Encerado', 'Limpieza interior', 'Aromatizante']
      },
      {
        name: 'Cambio de Aceite',
        description: 'Cambio de aceite y filtro',
        category: 'maintenance',
        price: 400,
        duration: 30,
        isActive: true,
        isPopular: false,
        features: ['Aceite sintético', 'Filtro nuevo', 'Revisión de niveles']
      }
    ];

    await db.collection('services').insertMany(services);
    console.log(`   ✅ ${services.length} servicios creados\n`);

    // 2. Crear usuario administrador
    console.log('2️⃣  Creando usuario administrador...\n');
    
    const adminUser = new User({
      name: 'Administrador',
      email: 'admin@verifireando.com',
      phone: '+525500000000',
      password: 'admin123456',
      role: 'admin',
      isVerified: true,
      isActive: true
    });

    await adminUser.save();
    console.log('   ✅ Usuario admin creado');
    console.log('   📧 Email: admin@verifireando.com');
    console.log('   🔑 Password: admin123456\n');

    // 3. Crear cupones de ejemplo
    console.log('3️⃣  Creando cupones de descuento...\n');
    
    const coupons = [
      {
        code: 'BIENVENIDO',
        description: 'Descuento de bienvenida para nuevos usuarios',
        discountType: 'percentage',
        discountValue: 20,
        minAmount: 0,
        maxDiscount: 200,
        isActive: true,
        usageLimit: 1000,
        usedCount: 0,
        expiryDate: new Date('2025-12-31'),
        applicableServices: []
      },
      {
        code: 'VERANO2025',
        description: 'Descuento especial de verano',
        discountType: 'fixed',
        discountValue: 100,
        minAmount: 500,
        maxDiscount: 100,
        isActive: true,
        usageLimit: 500,
        usedCount: 0,
        expiryDate: new Date('2025-09-30'),
        applicableServices: []
      }
    ];

    await db.collection('coupons').insertMany(coupons);
    console.log(`   ✅ ${coupons.length} cupones creados\n`);

    // Resumen
    console.log('\n📊 RESUMEN DE DATOS CREADOS:\n');
    console.log('✅ 5 Servicios de verificación');
    console.log('✅ 1 Usuario administrador');
    console.log('✅ 2 Cupones de descuento');
    
    console.log('\n🔐 CREDENCIALES DE ADMIN:');
    console.log('   Email: admin@verifireando.com');
    console.log('   Password: admin123456');
    console.log('   Role: admin');

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Registra usuarios desde tu app móvil');
    console.log('   2. Los usuarios se guardarán en la colección "users"');
    console.log('   3. El código OTP aparecerá en los logs del servidor');
    console.log('   4. Los conductores suben su licencia después del registro');

    await mongoose.connection.close();
    console.log('\n✅ Base de datos inicializada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();
