const mongoose = require('mongoose');
require('dotenv').config();

// IMPORTANTE: Configura estas URIs
const LOCAL_URI = 'mongodb://localhost:27017/verifireando';
const ATLAS_URI = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://verifireando:verifireando123@cluster0.mongodb.net/verifireando?retryWrites=true&w=majority';

async function migrateToAtlas() {
  try {
    console.log('🚀 MIGRACIÓN A MONGODB ATLAS\n');
    console.log('=====================================\n');

    // Conectar a MongoDB local
    console.log('1️⃣  Conectando a MongoDB local...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('   ✅ Conectado a MongoDB local\n');

    // Conectar a MongoDB Atlas
    console.log('2️⃣  Conectando a MongoDB Atlas...');
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('   ✅ Conectado a MongoDB Atlas\n');

    // Obtener colecciones de local
    const localDb = localConn.db;
    const atlasDb = atlasConn.db;
    
    const collections = await localDb.listCollections().toArray();
    
    console.log('3️⃣  Migrando datos...\n');
    
    let totalDocuments = 0;
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const localCollection = localDb.collection(collectionName);
      const atlasCollection = atlasDb.collection(collectionName);
      
      // Contar documentos
      const count = await localCollection.countDocuments();
      
      if (count === 0) {
        console.log(`   ⏭️  ${collectionName}: 0 documentos (saltando)`);
        continue;
      }
      
      // Obtener todos los documentos
      const documents = await localCollection.find({}).toArray();
      
      // Limpiar colección en Atlas (opcional)
      await atlasCollection.deleteMany({});
      
      // Insertar en Atlas
      if (documents.length > 0) {
        await atlasCollection.insertMany(documents);
        console.log(`   ✅ ${collectionName}: ${documents.length} documentos migrados`);
        totalDocuments += documents.length;
      }
    }
    
    console.log(`\n📊 RESUMEN DE MIGRACIÓN:\n`);
    console.log(`   Total de documentos migrados: ${totalDocuments}`);
    console.log(`   Colecciones procesadas: ${collections.length}`);
    
    // Verificar datos en Atlas
    console.log('\n4️⃣  Verificando datos en Atlas...\n');
    
    const atlasCollections = await atlasDb.listCollections().toArray();
    for (const collection of atlasCollections) {
      const count = await atlasDb.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documentos`);
    }
    
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('1. Actualiza la variable MONGODB_URI en tu servidor de producción');
    console.log('2. Usa esta URI:');
    console.log(`   ${ATLAS_URI}\n`);
    console.log('3. Reinicia tu servidor de producción');
    console.log('4. Verifica en: https://www.verificandoando.com.mx/api/diagnostics\n');

    await localConn.close();
    await atlasConn.close();

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error('\n💡 POSIBLES SOLUCIONES:');
    console.error('1. Verifica que MongoDB local esté corriendo');
    console.error('2. Verifica las credenciales de Atlas');
    console.error('3. Verifica que la IP esté en whitelist de Atlas (0.0.0.0/0)');
    process.exit(1);
  }
}

migrateToAtlas();
