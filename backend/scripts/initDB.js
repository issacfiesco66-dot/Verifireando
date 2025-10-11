const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
  process.exit(1);
}

const client = new MongoClient(uri);

async function initDB() {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    await client.connect();
    console.log('✅ Conectado exitosamente a MongoDB Atlas');
    
    const db = client.db("verifireando");
    console.log('📊 Usando base de datos: verifireando');

    // Verificar colecciones existentes
    const collections = await db.listCollections().toArray();
    const existing = collections.map(c => c.name);
    console.log('📋 Colecciones existentes:', existing);

    // Colecciones requeridas para Verifireando
    const required = ["users", "drivers", "appointments", "cars", "notifications", "payments"];
    
    console.log('🔍 Verificando colecciones requeridas...');
    for (const col of required) {
      if (!existing.includes(col)) {
        await db.createCollection(col);
        console.log(`✅ Colección creada: ${col}`);
      } else {
        console.log(`ℹ️  Colección ya existe: ${col}`);
      }
    }

    // Crear índices importantes
    console.log('🔧 Creando índices...');
    
    // Índices para users
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Índice único creado en users.email');
    
    // Índices para drivers
    await db.collection('drivers').createIndex({ email: 1 }, { unique: true });
    await db.collection('drivers').createIndex({ licenseNumber: 1 }, { unique: true });
    await db.collection('drivers').createIndex({ "vehicleInfo.plates": 1 }, { unique: true });
    console.log('✅ Índices creados en drivers');
    
    // Índices para appointments
    await db.collection('appointments').createIndex({ appointmentNumber: 1 }, { unique: true });
    await db.collection('appointments').createIndex({ client: 1 });
    await db.collection('appointments').createIndex({ driver: 1 });
    await db.collection('appointments').createIndex({ status: 1 });
    await db.collection('appointments').createIndex({ scheduledDate: 1 });
    console.log('✅ Índices creados en appointments');
    
    // Índices para cars
    await db.collection('cars').createIndex({ plates: 1 }, { unique: true });
    await db.collection('cars').createIndex({ owner: 1 });
    console.log('✅ Índices creados en cars');
    
    // Índices para notifications
    await db.collection('notifications').createIndex({ recipient: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    console.log('✅ Índices creados en notifications');
    
    // Índices para payments
    await db.collection('payments').createIndex({ paymentNumber: 1 }, { unique: true });
    await db.collection('payments').createIndex({ appointment: 1 });
    console.log('✅ Índices creados en payments');

    console.log('🎉 Base de datos inicializada correctamente');
    console.log('📊 Estadísticas:');
    
    for (const col of required) {
      const count = await db.collection(col).countDocuments();
      console.log(`   - ${col}: ${count} documentos`);
    }

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar inicialización
initDB().catch(console.dir);