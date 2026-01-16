const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

let clientToken = null;
let driverToken = null;
let clientId = null;
let driverId = null;
let carId = null;
let appointmentId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed++;
    log(`✓ ${testName}`, 'green');
    if (details) log(`  ${details}`, 'cyan');
  } else {
    testResults.failed++;
    log(`✗ ${testName}`, 'red');
    if (details) log(`  ${details}`, 'yellow');
    testResults.errors.push({ test: testName, error: details });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 1. PRUEBA DE REGISTRO
// ============================================
async function testRegister() {
  log('\n=== PRUEBA 1: REGISTRO ===', 'blue');
  
  // Registro de cliente
  try {
    const timestamp = Date.now();
    const clientData = {
      name: 'Cliente Test',
      email: `cliente.test.${timestamp}@test.com`,
      phone: `+5255${timestamp.toString().slice(-8)}`,
      password: 'password123',
      role: 'client'
    };
    
    const response = await axios.post(`${API_URL}/auth/register`, clientData);
    
    if (response.status === 201 && response.data.userId) {
      clientId = response.data.userId;
      logTest('Registro de cliente', true, `ID: ${clientId}, Código OTP: ${response.data.devCode}`);
      
      // Verificar OTP automáticamente
      if (response.data.devCode) {
        await sleep(500);
        const verifyResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
          email: clientData.email,
          code: response.data.devCode,
          role: 'client'
        });
        
        if (verifyResponse.status === 200 && verifyResponse.data.token) {
          clientToken = verifyResponse.data.token;
          logTest('Verificación OTP de cliente', true, 'Token obtenido');
        } else {
          logTest('Verificación OTP de cliente', false, 'No se obtuvo token');
        }
      }
    } else {
      logTest('Registro de cliente', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Registro de cliente', false, error.response?.data?.message || error.message);
  }
  
  await sleep(1000);
  
  // Registro de chofer
  try {
    const timestamp = Date.now();
    const driverData = {
      name: 'Chofer Test',
      email: `chofer.test.${timestamp}@test.com`,
      phone: `+5255${timestamp.toString().slice(-8)}`,
      password: 'password123',
      role: 'driver',
      licenseNumber: `LIC${timestamp}`,
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const response = await axios.post(`${API_URL}/auth/register`, driverData);
    
    if (response.status === 201 && response.data.userId) {
      driverId = response.data.userId;
      logTest('Registro de chofer', true, `ID: ${driverId}, Código OTP: ${response.data.devCode}`);
      
      // Verificar OTP automáticamente
      if (response.data.devCode) {
        await sleep(500);
        const verifyResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
          email: driverData.email,
          code: response.data.devCode,
          role: 'driver'
        });
        
        if (verifyResponse.status === 200 && verifyResponse.data.token) {
          driverToken = verifyResponse.data.token;
          logTest('Verificación OTP de chofer', true, 'Token obtenido');
        } else {
          logTest('Verificación OTP de chofer', false, 'No se obtuvo token');
        }
      }
    } else {
      logTest('Registro de chofer', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Registro de chofer', false, error.response?.data?.message || error.message);
  }
}

// ============================================
// 2. PRUEBA DE LOGIN
// ============================================
async function testLogin() {
  log('\n=== PRUEBA 2: LOGIN ===', 'blue');
  
  // Si no tenemos tokens, intentar login con usuarios de prueba existentes
  if (!clientToken) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: 'cliente@test.com',
        password: 'password123'
      });
      
      if (response.status === 200 && response.data.token) {
        clientToken = response.data.token;
        clientId = response.data.user.id;
        logTest('Login de cliente', true, `Token obtenido para ${response.data.user.email}`);
      } else {
        logTest('Login de cliente', false, 'No se obtuvo token');
      }
    } catch (error) {
      logTest('Login de cliente', false, error.response?.data?.message || error.message);
    }
  } else {
    logTest('Login de cliente', true, 'Ya autenticado desde registro');
  }
  
  await sleep(500);
  
  if (!driverToken) {
    try {
      const response = await axios.post(`${API_URL}/auth/login/driver`, {
        email: 'chofer@test.com',
        password: 'password123'
      });
      
      if (response.status === 200 && response.data.token) {
        driverToken = response.data.token;
        driverId = response.data.user.id;
        logTest('Login de chofer', true, `Token obtenido para ${response.data.user.email}`);
      } else {
        logTest('Login de chofer', false, 'No se obtuvo token');
      }
    } catch (error) {
      logTest('Login de chofer', false, error.response?.data?.message || error.message);
    }
  } else {
    logTest('Login de chofer', true, 'Ya autenticado desde registro');
  }
}

// ============================================
// 3. CREAR VEHÍCULO (necesario para cita)
// ============================================
async function createCar() {
  log('\n=== CREAR VEHÍCULO ===', 'blue');
  
  if (!clientToken) {
    logTest('Crear vehículo', false, 'No hay token de cliente');
    return;
  }
  
  try {
    const randomNum = Math.floor(Math.random() * 1000);
    const carData = {
      plates: `ABC${randomNum.toString().padStart(3, '0')}`,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Blanco',
      engineType: 'gasoline'
    };
    
    const response = await axios.post(`${API_URL}/cars`, carData, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    
    if (response.status === 201 && response.data.car) {
      carId = response.data.car._id;
      logTest('Crear vehículo', true, `ID: ${carId}, Placas: ${carData.plates}`);
    } else {
      logTest('Crear vehículo', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Crear vehículo', false, error.response?.data?.message || error.message);
  }
}

// ============================================
// 4. PRUEBA DE GENERAR CITA
// ============================================
async function testCreateAppointment() {
  log('\n=== PRUEBA 3: GENERAR CITA ===', 'blue');
  
  if (!clientToken) {
    logTest('Generar cita', false, 'No hay token de cliente');
    return;
  }
  
  if (!carId) {
    logTest('Generar cita', false, 'No hay vehículo registrado');
    return;
  }
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const appointmentData = {
      car: carId,
      scheduledDate: tomorrow.toISOString(),
      scheduledTime: '10:00',
      services: {
        verification: true,
        additionalServices: []
      },
      pickupAddress: {
        street: 'Av. Reforma 123',
        city: 'Ciudad de México',
        state: 'CDMX',
        zipCode: '06600',
        coordinates: {
          lat: 19.4326,
          lng: -99.1332
        }
      },
      deliveryAddress: {
        street: 'Av. Reforma 123',
        city: 'Ciudad de México',
        state: 'CDMX',
        zipCode: '06600',
        coordinates: {
          lat: 19.4326,
          lng: -99.1332
        }
      },
      notes: 'Prueba de cita'
    };
    
    const response = await axios.post(`${API_URL}/appointments`, appointmentData, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    
    if (response.status === 201 && response.data.appointment) {
      appointmentId = response.data.appointment._id;
      logTest('Generar cita', true, `ID: ${appointmentId}, Número: ${response.data.appointment.appointmentNumber}`);
    } else {
      logTest('Generar cita', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Generar cita', false, error.response?.data?.message || error.message);
  }
}

// ============================================
// 5. PRUEBA DE AÑADIR SERVICIOS
// ============================================
async function testAddServices() {
  log('\n=== PRUEBA 4: AÑADIR SERVICIOS ===', 'blue');
  
  // Primero obtener servicios disponibles
  try {
    const response = await axios.get(`${API_URL}/services`);
    
    if (response.status === 200 && response.data.success && response.data.data) {
      logTest('Obtener servicios disponibles', true, `${response.data.data.length} servicios encontrados`);
      
      // Mostrar algunos servicios
      if (response.data.data.length > 0) {
        const firstService = response.data.data[0];
        log(`  Ejemplo: ${firstService.name} - $${firstService.basePrice}`, 'cyan');
      }
    } else {
      logTest('Obtener servicios disponibles', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Obtener servicios disponibles', false, error.response?.data?.message || error.message);
  }
  
  await sleep(500);
  
  // Crear un segundo vehículo para esta prueba
  let secondCarId = null;
  if (clientToken) {
    try {
      const randomNum = Math.floor(Math.random() * 1000);
      const carData = {
        plates: `XYZ${randomNum.toString().padStart(3, '0')}`,
        brand: 'Honda',
        model: 'Civic',
        year: 2021,
        color: 'Negro',
        engineType: 'gasoline'
      };
      
      const carResponse = await axios.post(`${API_URL}/cars`, carData, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      if (carResponse.status === 201 && carResponse.data.car) {
        secondCarId = carResponse.data.car._id;
      }
    } catch (error) {
      // Ignorar error, continuaremos sin segundo vehículo
    }
  }
  
  // Crear una nueva cita con servicios adicionales
  if (!clientToken || !secondCarId) {
    logTest('Crear cita con servicios adicionales', false, 'Faltan datos necesarios');
    return;
  }
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(14, 0, 0, 0);
    
    const appointmentData = {
      car: secondCarId,
      scheduledDate: tomorrow.toISOString(),
      scheduledTime: '14:00',
      services: {
        verification: true,
        additionalServices: [
          { name: 'wash', price: 150 },
          { name: 'oil_change', price: 300 }
        ]
      },
      pickupAddress: {
        street: 'Av. Insurgentes 456',
        city: 'Ciudad de México',
        state: 'CDMX',
        zipCode: '03100',
        coordinates: {
          lat: 19.3910,
          lng: -99.1630
        }
      },
      deliveryAddress: {
        street: 'Av. Insurgentes 456',
        city: 'Ciudad de México',
        state: 'CDMX',
        zipCode: '03100',
        coordinates: {
          lat: 19.3910,
          lng: -99.1630
        }
      },
      notes: 'Cita con servicios adicionales'
    };
    
    const response = await axios.post(`${API_URL}/appointments`, appointmentData, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    
    if (response.status === 201 && response.data.appointment) {
      const servicesCount = response.data.appointment.services?.additionalServices?.length || 0;
      logTest('Crear cita con servicios adicionales', true, 
        `${servicesCount} servicios adicionales, Total: $${response.data.appointment.pricing?.total || 0}`);
    } else {
      logTest('Crear cita con servicios adicionales', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Crear cita con servicios adicionales', false, error.response?.data?.message || error.message);
  }
}

// ============================================
// 6. PRUEBA DE ACEPTAR/VERIFICAR CITA
// ============================================
async function testAcceptAppointment() {
  log('\n=== PRUEBA 5: ACEPTAR/VERIFICAR CITA ===', 'blue');
  
  if (!driverToken) {
    logTest('Aceptar cita (chofer)', false, 'No hay token de chofer');
    return;
  }
  
  // Primero obtener citas disponibles
  try {
    const response = await axios.get(`${API_URL}/appointments/driver/available`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    
    if (response.status === 200 && response.data.appointments) {
      logTest('Obtener citas disponibles (chofer)', true, `${response.data.appointments.length} citas disponibles`);
      
      // Si hay citas disponibles, aceptar la primera
      if (response.data.appointments.length > 0) {
        const availableAppointment = response.data.appointments[0];
        
        await sleep(500);
        
        try {
          const acceptResponse = await axios.put(
            `${API_URL}/appointments/${availableAppointment._id}/accept`,
            {},
            { headers: { Authorization: `Bearer ${driverToken}` } }
          );
          
          if (acceptResponse.status === 200) {
            logTest('Aceptar cita', true, 
              `Cita ${acceptResponse.data.appointment?.appointmentNumber} aceptada, Código: ${acceptResponse.data.appointment?.pickupCode}`);
            
            // Guardar el ID de la cita aceptada para pruebas posteriores
            if (!appointmentId) {
              appointmentId = availableAppointment._id;
            }
          } else {
            logTest('Aceptar cita', false, 'Respuesta inválida');
          }
        } catch (error) {
          logTest('Aceptar cita', false, error.response?.data?.message || error.message);
        }
      } else {
        log('  No hay citas disponibles para aceptar', 'yellow');
      }
    } else {
      logTest('Obtener citas disponibles (chofer)', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Obtener citas disponibles (chofer)', false, error.response?.data?.message || error.message);
  }
}

// ============================================
// 7. PRUEBA DE TERMINAR CITA
// ============================================
async function testCompleteAppointment() {
  log('\n=== PRUEBA 6: TERMINAR CITA ===', 'blue');
  
  if (!driverToken || !appointmentId) {
    logTest('Actualizar estado de cita', false, 'Faltan datos necesarios');
    return;
  }
  
  // Simular el flujo completo de estados
  const statusFlow = [
    { status: 'driver_enroute', notes: 'Chofer en camino' },
    { status: 'picked_up', notes: 'Vehículo recogido' },
    { status: 'in_verification', notes: 'Verificación en proceso' },
    { status: 'completed', notes: 'Verificación completada' }
  ];
  
  for (const statusUpdate of statusFlow) {
    try {
      await sleep(1000);
      
      const response = await axios.put(
        `${API_URL}/appointments/${appointmentId}/status`,
        statusUpdate,
        { headers: { Authorization: `Bearer ${driverToken}` } }
      );
      
      if (response.status === 200) {
        logTest(`Actualizar estado a '${statusUpdate.status}'`, true, statusUpdate.notes);
      } else {
        logTest(`Actualizar estado a '${statusUpdate.status}'`, false, 'Respuesta inválida');
        break;
      }
    } catch (error) {
      logTest(`Actualizar estado a '${statusUpdate.status}'`, false, 
        error.response?.data?.message || error.message);
      break;
    }
  }
}

// ============================================
// 8. PRUEBA DE UBICACIÓN DE ENTREGA
// ============================================
async function testDeliveryLocation() {
  log('\n=== PRUEBA 7: UBICACIÓN DE ENTREGA ===', 'blue');
  
  if (!driverToken || !appointmentId) {
    logTest('Marcar como entregado', false, 'Faltan datos necesarios');
    return;
  }
  
  try {
    const deliveryUpdate = {
      status: 'delivered',
      notes: 'Vehículo entregado al cliente',
      location: {
        lat: 19.4326,
        lng: -99.1332
      }
    };
    
    const response = await axios.put(
      `${API_URL}/appointments/${appointmentId}/status`,
      deliveryUpdate,
      { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    
    if (response.status === 200) {
      logTest('Marcar como entregado', true, 'Cita completada y entregada');
      
      // Obtener detalles de la cita para verificar deliveryAddress
      await sleep(500);
      
      try {
        const detailsResponse = await axios.get(
          `${API_URL}/appointments/${appointmentId}`,
          { headers: { Authorization: `Bearer ${clientToken || driverToken}` } }
        );
        
        if (detailsResponse.status === 200 && detailsResponse.data.appointment) {
          const appointment = detailsResponse.data.appointment;
          const hasDeliveryLocation = appointment.deliveryLocation || appointment.deliveryAddress;
          
          if (hasDeliveryLocation) {
            logTest('Verificar ubicación de entrega', true, 
              `Dirección: ${appointment.deliveryLocation?.address || appointment.deliveryAddress?.street || 'N/A'}`);
          } else {
            logTest('Verificar ubicación de entrega', false, 'No se encontró ubicación de entrega');
          }
        }
      } catch (error) {
        logTest('Verificar ubicación de entrega', false, error.response?.data?.message || error.message);
      }
    } else {
      logTest('Marcar como entregado', false, 'Respuesta inválida');
    }
  } catch (error) {
    logTest('Marcar como entregado', false, error.response?.data?.message || error.message);
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║   PRUEBAS DE RUTAS - VERIFIREANDO BACKEND    ║', 'cyan');
  log('╚════════════════════════════════════════════════╝', 'cyan');
  log(`\nURL Base: ${BASE_URL}`, 'cyan');
  
  try {
    await testRegister();
    await sleep(1000);
    
    await testLogin();
    await sleep(1000);
    
    await createCar();
    await sleep(1000);
    
    await testCreateAppointment();
    await sleep(1000);
    
    await testAddServices();
    await sleep(1000);
    
    await testAcceptAppointment();
    await sleep(1000);
    
    await testCompleteAppointment();
    await sleep(1000);
    
    await testDeliveryLocation();
    
  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
  }
  
  // Resumen final
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║              RESUMEN DE PRUEBAS               ║', 'cyan');
  log('╚════════════════════════════════════════════════╝', 'cyan');
  log(`\n✓ Pruebas exitosas: ${testResults.passed}`, 'green');
  log(`✗ Pruebas fallidas: ${testResults.failed}`, 'red');
  log(`📊 Total: ${testResults.passed + testResults.failed}`, 'blue');
  
  if (testResults.errors.length > 0) {
    log('\n❌ ERRORES ENCONTRADOS:', 'red');
    testResults.errors.forEach((err, index) => {
      log(`\n${index + 1}. ${err.test}`, 'yellow');
      log(`   ${err.error}`, 'red');
    });
  }
  
  log('\n');
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Ejecutar pruebas
runAllTests();
