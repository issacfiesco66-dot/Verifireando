const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/verifireando';
const ATLAS_URI = 'mongodb+srv://prueba:Chicharito26@verificandoando.iz5eoyu.mongodb.net/verifireando?retryWrites=true&w=majority&appName=Verificandoando';

async function cleanAndMigrate() {
  try {
    console.log('🚀 LIMPIEZA Y MIGRACIÓN A ATLAS\n');

    console.log('1️⃣  Conectando a MongoDB local...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('   ✅ Conectado\n');

    console.log('2️⃣  Conectando a MongoDB Atlas...');
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('   ✅ Conectado a Atlas\n');

    const localDb = localConn.db;
    const atlasDb = atlasConn.db;
    
    // Limpiar Atlas completamente
    console.log('3️⃣  Limpiando Atlas...');
    const existingCollections = await atlasDb.listCollections().toArray();
    for (const col of existingCollections) {
      await atlasDb.collection(col.name).drop().catch(() => {});
      console.log(`   🗑️  ${col.name} eliminada`);
    }
    console.log('   ✅ Atlas limpio\n');
    
    // Migrar datos
    console.log('4️⃣  Migrando datos...\n');
    const collections = await localDb.listCollections().toArray();
    
    let totalDocuments = 0;
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const localCollection = localDb.collection(collectionName);
      const count = await localCollection.countDocuments();
      
      if (count === 0) {
        console.log(`   ⏭️  ${collectionName}: vacío`);
        continue;
      }
      
      const documents = await localCollection.find({}).toArray();
      
      if (documents.length > 0) {
        await atlasDb.collection(collectionName).insertMany(documents);
        console.log(`   ✅ ${collectionName}: ${documents.length} documentos`);
        totalDocuments += documents.length;
      }
    }
    
    console.log(`\n📊 Total migrado: ${totalDocuments} documentos\n`);
    
    // Verificar
    console.log('5️⃣  Verificando en Atlas:\n');
    const finalCollections = await atlasDb.listCollections().toArray();
    for (const col of finalCollections) {
      const count = await atlasDb.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documentos`);
    }
    
    console.log('\n✅ MIGRACIÓN COMPLETADA\n');

    await localConn.close();
    await atlasConn.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

cleanAndMigrate();
