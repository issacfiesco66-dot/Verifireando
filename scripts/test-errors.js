const API_BASE = 'http://localhost:5000/api'

async function login(email, password, role) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

async function request(method, path, token, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

async function main() {
  console.log('Testing 401 (no token) on /cars...')
  const r1 = await request('GET', '/cars')
  console.log('Result:', r1.status, r1.text)

  console.log('Login as driver...')
  const driverLogin = await login('chofer@test.com', '123456', 'driver')
  const driverToken = driverLogin.data?.token

  console.log('Testing 403 (non-admin) on /drivers...')
  const r2 = await request('GET', '/drivers', driverToken)
  console.log('Result:', r2.status, r2.text)

  console.log('Login as client...')
  const clientLogin = await login('cliente@test.com', '123456', 'client')
  const clientToken = clientLogin.data?.token

  console.log('Testing 404 on DELETE /cars/:id with invalid id...')
  const r3 = await request('DELETE', '/cars/invalid-id', clientToken)
  console.log('Result:', r3.status, r3.text)

  console.log('Testing 404 on PUT /appointments/:id/accept with wrong id...')
  const r4 = await request('PUT', '/appointments/not-found/accept', driverToken)
  console.log('Result:', r4.status, r4.text)

  console.log('Done.')
}

main().catch(err => { console.error(err); process.exitCode = 1 })