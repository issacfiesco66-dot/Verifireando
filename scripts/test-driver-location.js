const { io } = require('socket.io-client')

function connectSocket(label) {
  const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: true
  })

  socket.on('connect', () => {
    console.log(`[${label}] connected:`, socket.id)
  })
  socket.on('disconnect', () => {
    console.log(`[${label}] disconnected`)
  })
  socket.on('driver-location-updated', (payload) => {
    console.log(`[${label}] driver-location-updated:`, payload)
  })

  return socket
}

async function main() {
  const client = connectSocket('client')
  const driver = connectSocket('driver')
  await new Promise(r => setTimeout(r, 800))
  console.log('Emitting location...')
  driver.emit('driver-location-update', { driverId: '3', lat: 19.44, lng: -99.12 })
  await new Promise(r => setTimeout(r, 1500))
  client.disconnect()
  driver.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})