require('dotenv').config();

console.log('=== JWT Configuration Debug ===');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
console.log('Using fallback:', !process.env.JWT_SECRET);

// Simular generación y verificación con las mismas claves
const jwt = require('jsonwebtoken');

const testPayload = { id: 'test123', email: 'test@test.com', role: 'client' };
const secret = process.env.JWT_SECRET || 'fallback-secret-key';

console.log('\n=== Token Generation Test ===');
console.log('Using secret:', secret);

const token = jwt.sign(testPayload, secret, { expiresIn: '7d' });
console.log('Generated token:', token);

console.log('\n=== Token Verification Test ===');
try {
  const decoded = jwt.verify(token, secret);
  console.log('✅ Verification successful:', decoded);
} catch (error) {
  console.log('❌ Verification failed:', error.message);
}

console.log('\n=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All JWT-related env vars:');
Object.keys(process.env).filter(key => key.toLowerCase().includes('jwt')).forEach(key => {
  console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
});
