const API_BASE = 'http://localhost:5001/api';

// Test credentials
const testCredentials = {
  client: { email: 'cliente@test.com', password: '123456', role: 'client' },
  driver: { email: 'chofer@test.com', password: '123456', role: 'driver' },
  admin: { email: 'admin@verifireando.com', password: '123456', role: 'admin' }
};

let tokens = {};

async function login(userType) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials[userType])
    });
    
    const data = await response.json();
    
    if (response.ok) {
      tokens[userType] = data.token;
      console.log(`✅ ${userType} login successful`);
      return data;
    } else {
      console.error(`❌ ${userType} login failed:`, data.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} login failed:`, error.message);
    return null;
  }
}

async function testEndpoint(method, endpoint, data = null, userType = 'client') {
  try {
    const config = {
      method: method.toUpperCase(),
      headers: {
        'Authorization': `Bearer ${tokens[userType]}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (response.ok) {
      console.log(`✅ ${method.toUpperCase()} ${endpoint} - Status: ${response.status}`);
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ ${method.toUpperCase()} ${endpoint} - Error: ${response.status} ${errorData.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} - Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API endpoint tests against 5001...\n');
  
  // Test authentication
  console.log('📝 Testing Authentication...');
  await login('client');
  await login('driver');
  await login('admin');
  console.log('');
  
  // Test services
  console.log('🧰 Testing Services endpoints...');
  await testEndpoint('get', '/services', null, 'client');
  await testEndpoint('get', '/services/categories/list', null, 'client');
  console.log('');

  // Test cars endpoints
  console.log('🚗 Testing Cars endpoints...');
  await testEndpoint('get', '/cars/my-cars', null, 'client');
  await testEndpoint('get', '/cars', null, 'client');
  
  // Create a new car (validate year and duplicate plates)
  console.log('🚗 Creating a new car for client...');
  const carCreateResp = await testEndpoint('post', '/cars', {
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    plates: 'TEST123',
    color: 'Azul'
  }, 'client');
  let carId = carCreateResp?.car?._id;
  if (!carId) {
    const myCarsResp = await testEndpoint('get', '/cars/my-cars', null, 'client');
    carId = myCarsResp?.cars?.[0]?._id;
    if (carId) {
      console.log(`ℹ️ Using existing car: ${carId}`);
    }
  }
  console.log('');
  
  // Test appointments endpoints
  console.log('📅 Testing Appointments endpoints...');
  await testEndpoint('get', '/appointments/my-appointments', null, 'client');
  await testEndpoint('get', '/appointments', null, 'client');
  console.log('');
  
  // Ensure driver is online and available
  console.log('🚛 Setting driver online & available...');
  await testEndpoint('put', '/drivers/status', { isOnline: true, isAvailable: true }, 'driver');
  console.log('');
  
  // Create appointment with v2 payload (cash)
  console.log('📅 Creating appointment (cash)...');
  const appointmentResp = await testEndpoint('post', '/appointments', {
    carId: carId,
    serviceType: 'verification',
    pickupLocation: { lat: 19.4326, lng: -99.1332 },
    scheduledDate: new Date().toISOString(),
    notes: 'Test appointment desde script'
  }, 'client');

  const appointmentId = appointmentResp?.appointment?._id;
  console.log('');

  // Create payment intent and confirm (card)
  console.log('💳 Creating payment intent...');
  const paymentIntentResp = await testEndpoint('post', '/payments/create-intent', {
    amount: 500,
    appointmentId,
    description: 'Pago de prueba'
  }, 'client');
  const paymentIntentId = paymentIntentResp?.paymentIntentId;

  console.log('✅ Confirming payment...');
  await testEndpoint('post', '/payments/confirm', {
    paymentIntentId
  }, 'client');
  console.log('');
  
  console.log('✨ API endpoint tests (5001) completed!');
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

runTests().catch(console.error);