/**
 * Script de auditoría completa del flujo de autenticación
 * Uso: node scripts/testAuthFlow.js
 * 
 * Prueba: registro, OTP, login, forgot-password, reset-password
 */
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
const TEST_EMAIL = `test_${Date.now()}@verifireando.com`;
const TEST_PASSWORD = 'Test@1234';
const TEST_PHONE = `5512345${Math.floor(Math.random() * 9000) + 1000}`;

let results = [];
let authToken = null;
let resetToken = null;
let otpCode = null;

const log = (status, test, detail = '') => {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${test}${detail ? ` — ${detail}` : ''}`);
  results.push({ status, test, detail });
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: () => true, // No lanzar errores por status HTTP
  headers: {
    'Content-Type': 'application/json',
    'Origin': process.env.FRONTEND_URL || 'https://www.verificandoando.com.mx'
  }
});

// ══════════════════════════════════════════════
// BLOQUE 1: REGISTRO
// ══════════════════════════════════════════════
const testRegister = async () => {
  console.log('\n📋 BLOQUE 1: REGISTRO\n');

  // 1.1 Registro sin datos
  let r = await api.post('/auth/register', {});
  r.status === 400
    ? log('PASS', 'Registro sin datos → 400')
    : log('FAIL', 'Registro sin datos', `esperado 400, recibido ${r.status}`);

  // 1.2 Registro con email inválido
  r = await api.post('/auth/register', {
    name: 'Test User', email: 'invalid-email', phone: TEST_PHONE, password: TEST_PASSWORD
  });
  r.status === 400
    ? log('PASS', 'Registro email inválido → 400')
    : log('FAIL', 'Registro email inválido', `esperado 400, recibido ${r.status}`);

  // 1.3 Registro contraseña débil
  r = await api.post('/auth/register', {
    name: 'Test User', email: TEST_EMAIL, phone: TEST_PHONE, password: '123'
  });
  r.status === 400
    ? log('PASS', 'Registro contraseña débil → 400')
    : log('FAIL', 'Registro contraseña débil', `esperado 400, recibido ${r.status}`);

  // 1.4 Registro válido
  r = await api.post('/auth/register', {
    name: 'Test Auditoria', email: TEST_EMAIL, phone: TEST_PHONE,
    password: TEST_PASSWORD, role: 'client'
  });
  if (r.status === 201 && r.data.needsVerification) {
    log('PASS', 'Registro válido → 201 con needsVerification');
    otpCode = r.data.devCode;
    if (otpCode) log('PASS', `OTP devCode recibido: ${otpCode}`);
    else log('WARN', 'devCode no recibido (NODE_ENV no es development)');
  } else {
    log('FAIL', 'Registro válido', `status: ${r.status}, data: ${JSON.stringify(r.data)}`);
  }

  // 1.5 Registro duplicado
  r = await api.post('/auth/register', {
    name: 'Test Auditoria', email: TEST_EMAIL, phone: TEST_PHONE,
    password: TEST_PASSWORD, role: 'client'
  });
  r.status === 409
    ? log('PASS', 'Registro duplicado → 409')
    : log('FAIL', 'Registro duplicado', `esperado 409, recibido ${r.status}`);
};

// ══════════════════════════════════════════════
// BLOQUE 2: VERIFICACIÓN OTP
// ══════════════════════════════════════════════
const testOTP = async () => {
  console.log('\n📋 BLOQUE 2: VERIFICACIÓN OTP\n');

  // 2.1 OTP inválido
  let r = await api.post('/auth/verify-otp', {
    email: TEST_EMAIL, code: '000000', role: 'client'
  });
  r.status === 400
    ? log('PASS', 'OTP inválido → 400')
    : log('FAIL', 'OTP inválido', `esperado 400, recibido ${r.status}`);

  // 2.2 OTP válido (solo si tenemos devCode)
  if (otpCode) {
    r = await api.post('/auth/verify-otp', {
      email: TEST_EMAIL, code: otpCode, role: 'client'
    });
    if (r.status === 200 && r.data.token) {
      log('PASS', 'OTP válido → 200 con token JWT');
      authToken = r.data.token;
    } else {
      log('FAIL', 'OTP válido', `status: ${r.status}, data: ${JSON.stringify(r.data)}`);
    }
  } else {
    log('WARN', 'OTP válido — SKIP (devCode no disponible)');
  }

  // 2.3 Reenvío OTP
  r = await api.post('/auth/resend-otp', { email: TEST_EMAIL, role: 'client' });
  if (r.status === 200 || r.status === 400) {
    otpCode = r.data.devCode || otpCode;
    log(r.status === 200 ? 'PASS' : 'WARN', `Reenvío OTP → ${r.status}`, r.data.message);
  } else {
    log('FAIL', 'Reenvío OTP', `status: ${r.status}`);
  }
};

// ══════════════════════════════════════════════
// BLOQUE 3: LOGIN
// ══════════════════════════════════════════════
const testLogin = async () => {
  console.log('\n📋 BLOQUE 3: LOGIN\n');

  // 3.1 Login con credenciales incorrectas
  let r = await api.post('/auth/login', {
    email: TEST_EMAIL, password: 'WrongPass@99'
  });
  r.status === 401
    ? log('PASS', 'Login credenciales incorrectas → 401')
    : log('FAIL', 'Login credenciales incorrectas', `esperado 401, recibido ${r.status}`);

  // 3.2 Login usuario no verificado
  r = await api.post('/auth/login', {
    email: TEST_EMAIL, password: TEST_PASSWORD
  });
  if (r.status === 200 && r.data.token) {
    log('PASS', 'Login exitoso → 200 con token');
    authToken = r.data.token;
  } else if (r.status === 403 && r.data.needsVerification) {
    log('WARN', 'Login → usuario no verificado (403). Verificando con OTP...');
    // Intentar verificar si tenemos OTP
    if (otpCode) {
      const verifyR = await api.post('/auth/verify-otp', {
        email: TEST_EMAIL, code: otpCode, role: 'client'
      });
      if (verifyR.status === 200 && verifyR.data.token) {
        authToken = verifyR.data.token;
        log('PASS', 'Verificación post-reenvío → 200 con token');
        // Reintentar login
        r = await api.post('/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
        if (r.status === 200 && r.data.token) {
          authToken = r.data.token;
          log('PASS', 'Login post-verificación → 200 con token');
        }
      }
    }
  } else {
    log('FAIL', 'Login', `status: ${r.status}, data: ${JSON.stringify(r.data)}`);
  }
};

// ══════════════════════════════════════════════
// BLOQUE 4: FORGOT/RESET PASSWORD
// ══════════════════════════════════════════════
const testForgotReset = async () => {
  console.log('\n📋 BLOQUE 4: RECUPERACIÓN DE CONTRASEÑA\n');

  // 4.1 Forgot password sin email
  let r = await api.post('/auth/forgot-password', {});
  r.status === 400
    ? log('PASS', 'Forgot password sin email → 400')
    : log('FAIL', 'Forgot password sin email', `esperado 400, recibido ${r.status}`);

  // 4.2 Forgot password email no registrado → debe devolver 200 por seguridad
  r = await api.post('/auth/forgot-password', { email: 'noexiste@test.com' });
  r.status === 200
    ? log('PASS', 'Forgot password email no existe → 200 (seguridad)')
    : log('FAIL', 'Forgot password email no existe', `esperado 200, recibido ${r.status}`);

  // 4.3 Forgot password email válido → debe devolver 200
  r = await api.post('/auth/forgot-password', { email: TEST_EMAIL });
  if (r.status === 200) {
    log('PASS', 'Forgot password email válido → 200');
    resetToken = r.data.resetToken;
    if (resetToken) log('PASS', `resetToken devCode recibido (${resetToken.substring(0, 20)}...)`);
    else log('WARN', 'resetToken no recibido en respuesta (SMTP puede estar activo)');
  } else {
    log('FAIL', 'Forgot password email válido', `status: ${r.status}, data: ${JSON.stringify(r.data)}`);
  }

  // 4.4 Validate reset token
  if (resetToken) {
    r = await api.post('/auth/validate-reset-token', { token: resetToken });
    r.status === 200 && r.data.valid
      ? log('PASS', 'Validate reset token válido → 200')
      : log('FAIL', 'Validate reset token', `status: ${r.status}, data: ${JSON.stringify(r.data)}`);

    // 4.5 Reset password con token válido
    const newPass = 'NewTest@5678';
    r = await api.post('/auth/reset-password', { token: resetToken, password: newPass });
    if (r.status === 200) {
      log('PASS', 'Reset password con token válido → 200');
      
      // 4.6 Login con nueva contraseña
      const loginR = await api.post('/auth/login', { email: TEST_EMAIL, password: newPass });
      if (loginR.status === 200 && loginR.data.token) {
        log('PASS', 'Login con nueva contraseña → 200');
        authToken = loginR.data.token;
        // Restaurar contraseña original
        const restoreR = await api.post('/auth/reset-password', {
          token: (await api.post('/auth/forgot-password', { email: TEST_EMAIL })).data.resetToken,
          password: TEST_PASSWORD
        });
        if (restoreR?.status === 200) log('PASS', 'Contraseña restaurada a original');
      } else {
        log('FAIL', 'Login con nueva contraseña', `status: ${loginR.status}`);
      }
    } else {
      log('FAIL', 'Reset password', `status: ${r.status}, data: ${JSON.stringify(r.data)}`);
    }
  } else {
    log('WARN', 'Reset password — SKIP (resetToken no disponible)');
  }
};

// ══════════════════════════════════════════════
// BLOQUE 5: RUTA PROTEGIDA
// ══════════════════════════════════════════════
const testProtectedRoute = async () => {
  console.log('\n📋 BLOQUE 5: RUTAS PROTEGIDAS\n');

  // 5.1 Sin token
  let r = await api.get('/appointments/my-appointments');
  r.status === 401
    ? log('PASS', 'Ruta protegida sin token → 401')
    : log('FAIL', 'Ruta protegida sin token', `esperado 401, recibido ${r.status}`);

  // 5.2 Con token
  if (authToken) {
    r = await api.get('/appointments/my-appointments', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    r.status === 200
      ? log('PASS', 'Ruta protegida con token válido → 200')
      : log('FAIL', 'Ruta protegida con token', `esperado 200, recibido ${r.status}`);
  } else {
    log('WARN', 'Ruta protegida con token — SKIP (no hay token)');
  }
};

// ══════════════════════════════════════════════
// RESUMEN
// ══════════════════════════════════════════════
const printSummary = () => {
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  
  console.log('\n═══════════════════════════════════════');
  console.log(`📊 RESUMEN: ${pass} PASS | ${fail} FAIL | ${warn} WARN`);
  console.log('═══════════════════════════════════════');
  
  if (fail > 0) {
    console.log('\n❌ FALLAS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.test}: ${r.detail}`);
    });
  }
  
  if (warn > 0) {
    console.log('\n⚠️  ADVERTENCIAS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   • ${r.test}: ${r.detail}`);
    });
  }
  
  console.log(`\n🔑 Usuario de prueba creado: ${TEST_EMAIL}`);
  console.log('   Ejecuta "node scripts/cleanDb.js --users-only" para limpiar\n');
};

// ══════════════════════════════════════════════
// EJECUTAR TODOS LOS TESTS
// ══════════════════════════════════════════════
const runAudit = async () => {
  console.log('═══════════════════════════════════════');
  console.log('🔍 AUDITORÍA COMPLETA DEL FLUJO AUTH');
  console.log(`📡 API: ${BASE_URL}`);
  console.log(`📧 Email de prueba: ${TEST_EMAIL}`);
  console.log('═══════════════════════════════════════');

  try {
    await testRegister();
    await testOTP();
    await testLogin();
    await testForgotReset();
    await testProtectedRoute();
  } catch (err) {
    console.error('\n💥 Error fatal en auditoría:', err.message);
  }

  printSummary();
};

runAudit();
