/**
 * Script de prueba manual para todos los endpoints de Verifireando API
 * Ejecutar con: node test-endpoints.js
 */

const axios = require('axios');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Variables globales para almacenar datos de prueba
let clientToken = '';
let driverToken = '';
let adminToken = '';
let carId = '';
let appointmentId = '';
let driverId = '';
let clientEmail = `test-client-${Date.now()}@test.com`;
let driverEmail = `test-driver-${Date.now()}@test.com`;

// Utilidades
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(endpoint, status) {
  log(`✓ ${endpoint} - Status: ${status}`, 'green');
}

function logError(endpoint, error) {
  log(`✗ ${endpoint} - Error: ${error.message}`, 'red');
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Funciones de prueba
async function testHealthCheck() {
  logSection('1. HEALTH CHECK & DIAGNOSTICS');
  
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    logSuccess('GET /health', res.status);
  } catch (error) {
    logError('GET /health', error);
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/health`);
    logSuccess('GET /api/health', res.status);
  } catch (error) {
    logError('GET /api/health', error);
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/diagnostics`);
    logSuccess('GET /api/diagnostics', res.status);
  } catch (error) {
    logError('GET /api/diagnostics', error);
  }
}

async function testAuthRegister() {
  logSection('2. AUTH - REGISTRO');

  // Registrar cliente
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Cliente Test',
      email: clientEmail,
      phone: '+525512345678',
      password: 'password123',
      role: 'client'
    });
    logSuccess('POST /api/auth/register (client)', res.status);
    log(`   Cliente ID: ${res.data.userId}`, 'blue');
  } catch (error) {
    logError('POST /api/auth/register (client)', error);
  }

  await sleep(500);

  // Registrar chofer
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Chofer Test',
      email: driverEmail,
      phone: '+525587654321',
      password: 'password123',
      role: 'driver',
      licenseNumber: 'LIC123456',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      vehicleInfo: {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        plates: 'ABC-123-D',
        color: 'Blanco'
      }
    });
    logSuccess('POST /api/auth/register (driver)', res.status);
    log(`   Chofer ID: ${res.data.userId}`, 'blue');
    driverId = res.data.userId;
  } catch (error) {
    logError('POST /api/auth/register (driver)', error);
  }
}

async function testAuthLogin() {
  logSection('3. AUTH - LOGIN');

  // Login cliente
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: clientEmail,
      password: 'password123',
      role: 'client'
    });
    logSuccess('POST /api/auth/login (client)', res.status);
    clientToken = res.data.token;
    log(`   Token guardado`, 'blue');
  } catch (error) {
    logError('POST /api/auth/login (client)', error);
    log(`   Nota: El usuario puede necesitar verificación OTP`, 'yellow');
  }

  await sleep(500);

  // Login chofer
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: driverEmail,
      password: 'password123',
      role: 'driver'
    });
    logSuccess('POST /api/auth/login (driver)', res.status);
    driverToken = res.data.token;
  } catch (error) {
    logError('POST /api/auth/login (driver)', error);
  }
}

async function testAuthProfile() {
  logSection('4. AUTH - PERFIL');

  if (!clientToken) {
    log('⚠ Saltando pruebas de perfil - No hay token de cliente', 'yellow');
    return;
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    logSuccess('GET /api/auth/profile', res.status);
    log(`   Usuario: ${res.data.user.name}`, 'blue');
  } catch (error) {
    logError('GET /api/auth/profile', error);
  }

  await sleep(500);

  try {
    const res = await axios.put(`${BASE_URL}/api/auth/profile`, 
      {
        name: 'Cliente Test Actualizado',
        phone: '+525599999999'
      },
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    logSuccess('PUT /api/auth/profile', res.status);
  } catch (error) {
    logError('PUT /api/auth/profile', error);
  }
}

async function testServices() {
  logSection('5. SERVICIOS');

  try {
    const res = await axios.get(`${BASE_URL}/api/services`);
    logSuccess('GET /api/services', res.status);
    log(`   Servicios encontrados: ${res.data.data?.length || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/services', error);
  }

  await sleep(500);

  try {
    const res = await axios.get(`${BASE_URL}/api/services?popular=true&limit=5`);
    logSuccess('GET /api/services?popular=true', res.status);
    log(`   Servicios populares: ${res.data.data?.length || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/services?popular=true', error);
  }

  await sleep(500);

  try {
    const res = await axios.get(`${BASE_URL}/api/services/categories/list`);
    logSuccess('GET /api/services/categories/list', res.status);
    log(`   Categorías: ${res.data.data?.length || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/services/categories/list', error);
  }
}

async function testCars() {
  logSection('6. VEHÍCULOS');

  if (!clientToken) {
    log('⚠ Saltando pruebas de vehículos - No hay token de cliente', 'yellow');
    return;
  }

  // Crear vehículo
  try {
    const res = await axios.post(`${BASE_URL}/api/cars`,
      {
        plates: `TST-${Date.now().toString().slice(-3)}-X`,
        brand: 'Honda',
        model: 'Civic',
        year: 2021,
        color: 'Negro',
        vin: `VIN${Date.now()}`
      },
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    logSuccess('POST /api/cars', res.status);
    carId = res.data.car._id;
    log(`   Vehículo ID: ${carId}`, 'blue');
  } catch (error) {
    logError('POST /api/cars', error);
  }

  await sleep(500);

  // Obtener vehículos
  try {
    const res = await axios.get(`${BASE_URL}/api/cars`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    logSuccess('GET /api/cars', res.status);
    log(`   Vehículos encontrados: ${res.data.cars?.length || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/cars', error);
  }

  await sleep(500);

  // Obtener vehículo por ID
  if (carId) {
    try {
      const res = await axios.get(`${BASE_URL}/api/cars/${carId}`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      logSuccess(`GET /api/cars/${carId}`, res.status);
    } catch (error) {
      logError(`GET /api/cars/${carId}`, error);
    }

    await sleep(500);

    // Actualizar vehículo
    try {
      const res = await axios.put(`${BASE_URL}/api/cars/${carId}`,
        { color: 'Azul' },
        {
          headers: { Authorization: `Bearer ${clientToken}` }
        }
      );
      logSuccess(`PUT /api/cars/${carId}`, res.status);
    } catch (error) {
      logError(`PUT /api/cars/${carId}`, error);
    }
  }
}

async function testDrivers() {
  logSection('7. CHOFERES');

  try {
    const res = await axios.get(`${BASE_URL}/api/drivers`);
    logSuccess('GET /api/drivers', res.status);
    log(`   Choferes encontrados: ${res.data.drivers?.length || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/drivers', error);
  }

  await sleep(500);

  try {
    const res = await axios.get(`${BASE_URL}/api/drivers?search=test`);
    logSuccess('GET /api/drivers?search=test', res.status);
  } catch (error) {
    logError('GET /api/drivers?search=test', error);
  }

  if (driverToken) {
    await sleep(500);

    try {
      const res = await axios.get(`${BASE_URL}/api/drivers/stats`, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      logSuccess('GET /api/drivers/stats', res.status);
    } catch (error) {
      logError('GET /api/drivers/stats', error);
    }
  }
}

async function testAppointments() {
  logSection('8. CITAS');

  if (!clientToken || !carId) {
    log('⚠ Saltando pruebas de citas - Faltan token o vehículo', 'yellow');
    return;
  }

  // Crear cita
  try {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 2);

    const res = await axios.post(`${BASE_URL}/api/appointments`,
      {
        car: carId,
        scheduledDate: scheduledDate,
        scheduledTime: '10:00',
        services: {
          verification: true,
          additionalServices: []
        },
        pickupAddress: {
          street: 'Calle Test 123',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '01000',
          coordinates: {
            lat: 19.4326,
            lng: -99.1332
          }
        },
        deliveryAddress: {
          street: 'Calle Test 456',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '01000',
          coordinates: {
            lat: 19.4326,
            lng: -99.1332
          }
        },
        notes: 'Cita de prueba'
      },
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    logSuccess('POST /api/appointments', res.status);
    appointmentId = res.data.appointment._id;
    log(`   Cita ID: ${appointmentId}`, 'blue');
    log(`   Número: ${res.data.appointment.appointmentNumber}`, 'blue');
  } catch (error) {
    logError('POST /api/appointments', error);
  }

  await sleep(500);

  // Obtener citas
  try {
    const res = await axios.get(`${BASE_URL}/api/appointments`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    logSuccess('GET /api/appointments', res.status);
    log(`   Citas encontradas: ${res.data.appointments?.length || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/appointments', error);
  }

  await sleep(500);

  // Obtener cita por ID
  if (appointmentId) {
    try {
      const res = await axios.get(`${BASE_URL}/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      logSuccess(`GET /api/appointments/${appointmentId}`, res.status);
    } catch (error) {
      logError(`GET /api/appointments/${appointmentId}`, error);
    }

    await sleep(500);

    // Cancelar cita
    try {
      const res = await axios.put(`${BASE_URL}/api/appointments/${appointmentId}/cancel`,
        { reason: 'Prueba de cancelación' },
        {
          headers: { Authorization: `Bearer ${clientToken}` }
        }
      );
      logSuccess(`PUT /api/appointments/${appointmentId}/cancel`, res.status);
    } catch (error) {
      logError(`PUT /api/appointments/${appointmentId}/cancel`, error);
    }
  }
}

async function testNotifications() {
  logSection('9. NOTIFICACIONES');

  if (!clientToken) {
    log('⚠ Saltando pruebas de notificaciones - No hay token', 'yellow');
    return;
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    logSuccess('GET /api/notifications', res.status);
    log(`   Notificaciones: ${res.data.notifications?.length || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/notifications', error);
  }

  await sleep(500);

  try {
    const res = await axios.get(`${BASE_URL}/api/notifications/unread/count`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    logSuccess('GET /api/notifications/unread/count', res.status);
    log(`   No leídas: ${res.data.count || 0}`, 'blue');
  } catch (error) {
    logError('GET /api/notifications/unread/count', error);
  }
}

async function testAdmin() {
  logSection('10. ADMIN (Sin permisos - Debe fallar)');

  if (!clientToken) {
    log('⚠ Saltando pruebas de admin - No hay token', 'yellow');
    return;
  }

  try {
    await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    logError('GET /api/admin/dashboard/stats', new Error('Debería haber fallado'));
  } catch (error) {
    if (error.response?.status === 403) {
      logSuccess('GET /api/admin/dashboard/stats (403 esperado)', error.response.status);
    } else {
      logError('GET /api/admin/dashboard/stats', error);
    }
  }

  await sleep(500);

  try {
    await axios.get(`${BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    logError('GET /api/admin/settings', new Error('Debería haber fallado'));
  } catch (error) {
    if (error.response?.status === 403) {
      logSuccess('GET /api/admin/settings (403 esperado)', error.response.status);
    } else {
      logError('GET /api/admin/settings', error);
    }
  }
}

async function testErrorHandling() {
  logSection('11. MANEJO DE ERRORES');

  // Endpoint no existente
  try {
    await axios.get(`${BASE_URL}/api/ruta-inexistente`);
    logError('GET /api/ruta-inexistente', new Error('Debería haber fallado'));
  } catch (error) {
    if (error.response?.status === 404) {
      logSuccess('GET /api/ruta-inexistente (404 esperado)', error.response.status);
    } else {
      logError('GET /api/ruta-inexistente', error);
    }
  }

  await sleep(500);

  // Sin token
  try {
    await axios.get(`${BASE_URL}/api/cars`);
    logError('GET /api/cars (sin token)', new Error('Debería haber fallado'));
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('GET /api/cars (sin token - 401 esperado)', error.response.status);
    } else {
      logError('GET /api/cars (sin token)', error);
    }
  }

  await sleep(500);

  // Token inválido
  try {
    await axios.get(`${BASE_URL}/api/cars`, {
      headers: { Authorization: 'Bearer token-invalido' }
    });
    logError('GET /api/cars (token inválido)', new Error('Debería haber fallado'));
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('GET /api/cars (token inválido - 401 esperado)', error.response.status);
    } else {
      logError('GET /api/cars (token inválido)', error);
    }
  }
}

// Función principal
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     VERIFIREANDO API - PRUEBA DE ENDPOINTS                ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`\nBase URL: ${BASE_URL}\n`, 'blue');

  try {
    await testHealthCheck();
    await testAuthRegister();
    await testAuthLogin();
    await testAuthProfile();
    await testServices();
    await testCars();
    await testDrivers();
    await testAppointments();
    await testNotifications();
    await testAdmin();
    await testErrorHandling();

    logSection('RESUMEN');
    log('✓ Pruebas completadas', 'green');
    log('\nVariables guardadas:', 'blue');
    log(`  - Client Token: ${clientToken ? '✓' : '✗'}`, clientToken ? 'green' : 'red');
    log(`  - Driver Token: ${driverToken ? '✓' : '✗'}`, driverToken ? 'green' : 'red');
    log(`  - Car ID: ${carId ? '✓' : '✗'}`, carId ? 'green' : 'red');
    log(`  - Appointment ID: ${appointmentId ? '✓' : '✗'}`, appointmentId ? 'green' : 'red');
    log(`  - Driver ID: ${driverId ? '✓' : '✗'}`, driverId ? 'green' : 'red');
    
  } catch (error) {
    log('\n✗ Error general en las pruebas:', 'red');
    console.error(error);
  }

  log('\n');
}

// Ejecutar pruebas
runTests().catch(console.error);
