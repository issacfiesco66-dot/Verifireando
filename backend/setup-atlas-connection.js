const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAtlasConnection() {
  console.log('🔧 CONFIGURACIÓN DE MONGODB ATLAS\n');
  console.log('=====================================\n');
  
  console.log('📋 Necesito tu URI de MongoDB Atlas.');
  console.log('   Ejemplo: mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/verifireando\n');
  
  const atlasUri = await question('Ingresa tu URI de MongoDB Atlas: ');
  
  if (!atlasUri || !atlasUri.includes('mongodb')) {
    console.log('\n❌ URI inválida. Debe comenzar con mongodb:// o mongodb+srv://');
    rl.close();
    return;
  }
  
  console.log('\n🔍 Probando conexión a Atlas...\n');
  
  try {
    await mongoose.connect(atlasUri, {
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ CONEXIÓN EXITOSA A MONGODB ATLAS!\n');
    console.log('📊 Información de conexión:');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Base de datos: ${mongoose.connection.name}\n`);
    
    // Verificar colecciones existentes
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Colecciones en Atlas:');
    
    if (collections.length === 0) {
      console.log('   (vacío - necesita migración)\n');
    } else {
      for (const col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`   ${col.name}: ${count} documentos`);
      }
    }
    
    console.log('\n✅ CONFIGURACIÓN CORRECTA\n');
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('1. Copia esta URI a tu archivo .env en el servidor:');
    console.log(`   MONGODB_URI=${atlasUri}\n`);
    console.log('2. Si Atlas está vacío, ejecuta:');
    console.log('   node migrate-data-to-atlas.js\n');
    
    await mongoose.connection.close();
    rl.close();
    
  } catch (error) {
    console.log('\n❌ ERROR DE CONEXIÓN\n');
    console.log(`Mensaje: ${error.message}\n`);
    console.log('💡 POSIBLES CAUSAS:\n');
    console.log('1. Usuario o contraseña incorrectos');
    console.log('2. IP no está en whitelist (agrega 0.0.0.0/0 en Atlas)');
    console.log('3. Cluster no existe o está pausado');
    console.log('4. URI mal formateada\n');
    console.log('🔗 Ve a: https://cloud.mongodb.com');
    console.log('   → Network Access → Add IP Address → Allow from Anywhere\n');
    
    rl.close();
    process.exit(1);
  }
}

setupAtlasConnection();
