const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Obtener todas las colecciones
    const collections = await db.listCollections().toArray();
    
    console.log('🗑️  ELIMINANDO TODAS LAS COLECCIONES...\n');
    
    for (const collection of collections) {
      console.log(`   Eliminando: ${collection.name}`);
      await db.collection(collection.name).drop();
    }

    console.log('\n✅ Todas las colecciones eliminadas\n');

    // Crear colecciones con índices
    console.log('📦 CREANDO COLECCIONES CON ESTRUCTURA CORRECTA...\n');

    // 1. Colección USERS (clientes, conductores y admins)
    console.log('1️⃣  Creando colección: users');
    await db.createCollection('users');
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { phone: 1 }, unique: true, name: 'phone_unique' },
      { key: { role: 1 }, name: 'role_index' },
      { key: { isVerified: 1 }, name: 'verified_index' },
      { key: { 'driverProfile.isOnline': 1 }, name: 'driver_online_index', sparse: true },
      { key: { 'driverProfile.currentLocation': '2dsphere' }, name: 'driver_location_geo', sparse: true }
    ]);
    console.log('   ✅ Índices creados para users\n');

    // 2. Colección CARS (vehículos de clientes)
    console.log('2️⃣  Creando colección: cars');
    await db.createCollection('cars');
    await db.collection('cars').createIndexes([
      { key: { owner: 1 }, name: 'owner_index' },
      { key: { plates: 1 }, unique: true, name: 'plates_unique' },
      { key: { vin: 1 }, unique: true, sparse: true, name: 'vin_unique' },
      { key: { isVerified: 1 }, name: 'verified_index' }
    ]);
    console.log('   ✅ Índices creados para cars\n');

    // 3. Colección SERVICES (servicios de verificación)
    console.log('3️⃣  Creando colección: services');
    await db.createCollection('services');
    await db.collection('services').createIndexes([
      { key: { name: 1 }, name: 'name_index' },
      { key: { category: 1 }, name: 'category_index' },
      { key: { isActive: 1 }, name: 'active_index' },
      { key: { isPopular: 1 }, name: 'popular_index' }
    ]);
    console.log('   ✅ Índices creados para services\n');

    // 4. Colección APPOINTMENTS (citas)
    console.log('4️⃣  Creando colección: appointments');
    await db.createCollection('appointments');
    await db.collection('appointments').createIndexes([
      { key: { client: 1 }, name: 'client_index' },
      { key: { driver: 1 }, name: 'driver_index', sparse: true },
      { key: { car: 1 }, name: 'car_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { scheduledDate: 1 }, name: 'scheduled_date_index' },
      { key: { appointmentNumber: 1 }, unique: true, name: 'appointment_number_unique' }
    ]);
    console.log('   ✅ Índices creados para appointments\n');

    // 5. Colección PAYMENTS (pagos)
    console.log('5️⃣  Creando colección: payments');
    await db.createCollection('payments');
    await db.collection('payments').createIndexes([
      { key: { appointment: 1 }, name: 'appointment_index' },
      { key: { user: 1 }, name: 'user_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { stripePaymentIntentId: 1 }, unique: true, sparse: true, name: 'stripe_intent_unique' }
    ]);
    console.log('   ✅ Índices creados para payments\n');

    // 6. Colección NOTIFICATIONS (notificaciones)
    console.log('6️⃣  Creando colección: notifications');
    await db.createCollection('notifications');
    await db.collection('notifications').createIndexes([
      { key: { user: 1 }, name: 'user_index' },
      { key: { isRead: 1 }, name: 'read_index' },
      { key: { createdAt: 1 }, name: 'created_index' }
    ]);
    console.log('   ✅ Índices creados para notifications\n');

    // 7. Colección COUPONS (cupones de descuento)
    console.log('7️⃣  Creando colección: coupons');
    await db.createCollection('coupons');
    await db.collection('coupons').createIndexes([
      { key: { code: 1 }, unique: true, name: 'code_unique' },
      { key: { isActive: 1 }, name: 'active_index' },
      { key: { expiryDate: 1 }, name: 'expiry_index' }
    ]);
    console.log('   ✅ Índices creados para coupons\n');

    console.log('\n📊 RESUMEN DE ESTRUCTURA:\n');
    console.log('✅ users       - Clientes, conductores y admins (unificado)');
    console.log('✅ cars        - Vehículos de clientes');
    console.log('✅ services    - Servicios de verificación');
    console.log('✅ appointments- Citas de verificación');
    console.log('✅ payments    - Pagos y transacciones');
    console.log('✅ notifications- Notificaciones push/WhatsApp');
    console.log('✅ coupons     - Cupones de descuento');

    console.log('\n📝 ESTRUCTURA DE USERS:');
    console.log('   - Campos comunes: name, email, phone, password, role, isVerified');
    console.log('   - role: "client" | "driver" | "admin"');
    console.log('   - driverProfile: {} (solo para conductores)');
    console.log('     * licenseNumber, licenseExpiry, licenseDocument');
    console.log('     * vehicleInfo, rating, totalTrips');
    console.log('     * isOnline, isAvailable, currentLocation');

    await mongoose.connection.close();
    console.log('\n✅ Base de datos reiniciada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetDatabase();
