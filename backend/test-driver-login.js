const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDriverLogin() {
  console.log('🧪 PRUEBA DE LOGIN DE CONDUCTOR\n');
  console.log('================================\n');

  // Datos del conductor migrado
  const driverEmail = 'conductor.test@example.com';
  const driverPassword = 'password123'; // Asumiendo que usaste esta contraseña

  try {
    console.log('1️⃣ Intentando login como conductor...');
    console.log(`   Email: ${driverEmail}`);
    console.log(`   Role: driver\n`);

    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: driverEmail,
      password: driverPassword,
      role: 'driver'
    });

    console.log('✅ LOGIN EXITOSO!\n');
    console.log('📋 Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ ERROR EN LOGIN\n');
      console.log(`Status: ${error.response.status}`);
      console.log('Respuesta:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 403) {
        console.log('\n💡 El conductor necesita verificación OTP');
        console.log('   Verifica el código en los logs del servidor o en la BD');
      }
    } else {
      console.log('❌ ERROR:', error.message);
    }
  }

  // Probar con el otro conductor
  console.log('\n\n2️⃣ Intentando login con segundo conductor...');
  const driver2Email = 'test-driver-1766937425390@test.com';
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: driver2Email,
      password: 'password123',
      role: 'driver'
    });

    console.log('✅ LOGIN EXITOSO!\n');
    console.log('📋 Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ ERROR EN LOGIN\n');
      console.log(`Status: ${error.response.status}`);
      console.log('Respuesta:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 403 && error.response.data.needsVerification) {
        console.log('\n💡 Código OTP para verificación:', error.response.data.devCode);
        
        // Intentar verificar automáticamente
        console.log('\n3️⃣ Intentando verificar con el código OTP...');
        try {
          const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            email: driver2Email,
            code: error.response.data.devCode,
            role: 'driver'
          });
          
          console.log('✅ VERIFICACIÓN EXITOSA!\n');
          console.log('📋 Token recibido:');
          console.log(JSON.stringify(verifyResponse.data, null, 2));
          
          // Intentar login de nuevo
          console.log('\n4️⃣ Intentando login nuevamente después de verificar...');
          const loginAgain = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: driver2Email,
            password: 'password123',
            role: 'driver'
          });
          
          console.log('✅ LOGIN EXITOSO DESPUÉS DE VERIFICACIÓN!\n');
          console.log('📋 Respuesta:');
          console.log(JSON.stringify(loginAgain.data, null, 2));
          
        } catch (verifyError) {
          console.log('❌ Error en verificación:', verifyError.response?.data || verifyError.message);
        }
      }
    } else {
      console.log('❌ ERROR:', error.message);
    }
  }
}

testDriverLogin();
