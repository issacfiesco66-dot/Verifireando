// Simple realtime test for Verifireando memory server
// - Logs socket events for appointment lifecycle
// - Creates a car for the client, creates an appointment, and accepts it as driver

const { io } = require('socket.io-client')

const API_BASE = 'http://localhost:5000/api'

async function login(email, password, role) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Login failed for ${email}: ${res.status} ${text}`)
  }
  const data = await res.json()
  return { token: data.token, user: data.user }
}

async function createCar(token) {
  const carPayload = {
    brand: 'Toyota',
    model: 'Corolla',
    year: 2018,
    plates: `TEST-${Math.floor(Math.random() * 10000)}`,
    color: 'Azul'
  }
  const res = await fetch(`${API_BASE}/cars`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(carPayload)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Create car failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.car
}

async function createAppointment(token, carId) {
  const payload = {
    carId,
    serviceType: 'verification',
    pickupLocation: {
      lat: 19.4326,
      lng: -99.1332,
      address: 'CDMX Centro'
    },
    notes: 'Prueba de realtime',
    scheduledDate: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  }
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Create appointment failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.appointment
}

async function acceptAppointmentAsDriver(token, appointmentId) {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/accept`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Accept appointment failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.appointment
}

async function setDriverStatus(token, isOnline, isAvailable) {
  const res = await fetch(`${API_BASE}/drivers/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isOnline, isAvailable })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Set driver status failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.driver
}

function connectSocket(label) {
  const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: true
  })

  socket.on('connect', () => {
    console.log(`[${label}] socket connected:`, socket.id)
  })
  socket.on('disconnect', () => {
    console.log(`[${label}] socket disconnected`)
  })

  // Common realtime events
  socket.on('appointment-created', (payload) => {
    console.log(`[${label}] appointment-created:`, payload)
  })
  socket.on('appointment-assigned', (payload) => {
    console.log(`[${label}] appointment-assigned:`, payload)
  })
  socket.on('appointment-updated', (payload) => {
    console.log(`[${label}] appointment-updated:`, payload)
  })
  socket.on('driver-location-updated', (payload) => {
    console.log(`[${label}] driver-location-updated:`, payload)
  })

  return socket
}

async function main() {
  try {
    console.log('🔐 Logging in test users...')
    const { token: clientToken, user: clientUser } = await login('cliente@test.com', '123456', 'client')
    const { token: driverToken, user: driverUser } = await login('chofer@test.com', '123456', 'driver')

    // Ensure driver is online and available for assignment
    await setDriverStatus(driverToken, true, true)

    console.log('🧲 Connecting sockets...')
    const clientSocket = connectSocket('client')
    const driverSocket = connectSocket('driver')

    // Small wait to let sockets connect
    await new Promise(r => setTimeout(r, 1000))

    console.log('🚗 Creating a car for client...')
    const car = await createCar(clientToken)

    console.log('📅 Creating an appointment...')
    const appointment = await createAppointment(clientToken, car._id || car.id)

    console.log('✅ Created appointment:', appointment._id || appointment.id)

    // If appointment has driver assigned, accept it as the driver
    if (appointment.driverId && appointment.status === 'pending_driver_acceptance') {
      console.log('🧍‍♂️ Driver accepting the appointment...')
      await acceptAppointmentAsDriver(driverToken, appointment._id || appointment.id)
    } else {
      console.log('⚠️ No driver assigned or status not pending; skipping acceptance step')
    }

    // Emit a sample driver location update via driver socket
    console.log('📡 Emitting driver-location-update to test forwarding...')
    driverSocket.emit('driver-location-update', {
      driverId: driverUser._id || driverUser.id,
      lat: 19.43,
      lng: -99.14
    })

    console.log('⏳ Waiting 3s to capture realtime events...')
    await new Promise(r => setTimeout(r, 3000))

    clientSocket.disconnect()
    driverSocket.disconnect()

    console.log('🎉 Realtime test completed.')
  } catch (err) {
    console.error('❌ Test failed:', err)
    process.exitCode = 1
  }
}

main()