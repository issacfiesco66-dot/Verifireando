const mongoose = require('mongoose');

// URIs
const LOCAL_URI = 'mongodb://localhost:27017/verifireando';
const ATLAS_URI = 'mongodb+srv://prueba:Chicharito26@verificandoando.iz5eoyu.mongodb.net/verifireando?retryWrites=true&w=majority&appName=Verificandoando';

async function migrateNow() {
  try {
    console.log('🚀 MIGRANDO DATOS A MONGODB ATLAS\n');
    console.log('=====================================\n');

    // Conectar a MongoDB local
    console.log('1️⃣  Conectando a MongoDB local...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('   ✅ Conectado a MongoDB local\n');

    // Conectar a MongoDB Atlas
    console.log('2️⃣  Conectando a MongoDB Atlas...');
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('   ✅ Conectado a MongoDB Atlas');
    console.log(`   Host: ${atlasConn.host}\n`);

    // Obtener bases de datos
    const localDb = localConn.db;
    const atlasDb = atlasConn.db;
    
    const collections = await localDb.listCollections().toArray();
    
    console.log('3️⃣  Migrando colecciones...\n');
    
    let totalDocuments = 0;
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const localCollection = localDb.collection(collectionName);
      const atlasCollection = atlasDb.collection(collectionName);
      
      const count = await localCollection.countDocuments();
      
      if (count === 0) {
        console.log(`   ⏭️  ${collectionName}: 0 documentos (saltando)`);
        continue;
      }
      
      // Obtener documentos
      const documents = await localCollection.find({}).toArray();
      
      // Limpiar colección en Atlas
      await atlasCollection.deleteMany({});
      
      // Insertar en Atlas
      if (documents.length > 0) {
        await atlasCollection.insertMany(documents);
        console.log(`   ✅ ${collectionName}: ${documents.length} documentos migrados`);
        totalDocuments += documents.length;
      }
    }
    
    console.log(`\n📊 RESUMEN:\n`);
    console.log(`   Total documentos migrados: ${totalDocuments}`);
    console.log(`   Colecciones procesadas: ${collections.length}`);
    
    // Verificar en Atlas
    console.log('\n4️⃣  Verificando datos en Atlas...\n');
    
    const atlasCollections = await atlasDb.listCollections().toArray();
    for (const collection of atlasCollections) {
      const count = await atlasDb.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documentos`);
    }
    
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');

    await localConn.close();
    await atlasConn.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('Authentication failed')) {
      console.error('\n💡 La contraseña puede ser incorrecta.');
      console.error('   Verifica en MongoDB Atlas → Database Access');
    }
    process.exit(1);
  }
}

migrateNow();
