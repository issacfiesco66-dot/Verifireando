const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📊 COLECCIONES EN LA BASE DE DATOS:');
    console.log('=====================================\n');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      console.log(`📁 ${collectionName}: ${count} documentos`);
      
      // Mostrar algunos documentos de ejemplo
      if (count > 0 && count < 10) {
        const docs = await mongoose.connection.db.collection(collectionName).find({}).limit(5).toArray();
        console.log(`   Ejemplo de documentos:`);
        docs.forEach((doc, i) => {
          if (collectionName === 'users' || collectionName === 'drivers') {
            console.log(`   ${i + 1}. Email: ${doc.email}, Role: ${doc.role}, Verified: ${doc.isVerified}`);
          } else {
            console.log(`   ${i + 1}. ID: ${doc._id}`);
          }
        });
      }
      console.log('');
    }

    // Verificar usuarios específicamente
    console.log('\n👥 ANÁLISIS DE USUARIOS:');
    console.log('=====================================\n');
    
    const User = mongoose.connection.db.collection('users');
    const Driver = mongoose.connection.db.collection('drivers');
    
    const usersCount = await User.countDocuments();
    const driversCount = await Driver.countDocuments();
    
    console.log(`Total en colección 'users': ${usersCount}`);
    console.log(`Total en colección 'drivers': ${driversCount}\n`);
    
    if (usersCount > 0) {
      console.log('Usuarios en colección "users":');
      const users = await User.find({}).toArray();
      users.forEach(user => {
        console.log(`  - ${user.email} | Role: ${user.role} | Verified: ${user.isVerified} | Code: ${user.verificationCode || 'N/A'}`);
      });
    }
    
    if (driversCount > 0) {
      console.log('\nUsuarios en colección "drivers":');
      const drivers = await Driver.find({}).toArray();
      drivers.forEach(driver => {
        console.log(`  - ${driver.email} | Role: ${driver.role} | Verified: ${driver.isVerified} | Code: ${driver.verificationCode || 'N/A'}`);
      });
    }

    console.log('\n\n⚠️  PROBLEMA DETECTADO:');
    console.log('=====================================');
    if (driversCount > 0) {
      console.log('❌ Hay documentos en la colección "drivers" (tabla antigua)');
      console.log('✅ Todos los usuarios deben estar en la colección "users"');
      console.log('\n💡 SOLUCIÓN: Migrar los drivers a la colección users');
    } else {
      console.log('✅ No hay documentos en la colección "drivers"');
      console.log('✅ Todos los usuarios están en la colección "users"');
    }

    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
