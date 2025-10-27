const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

function bool(v) {
  return !!v;
}

router.get('/', (req, res) => {
  const usingServiceAccount = bool(process.env.FIREBASE_SERVICE_ACCOUNT);
  const usingSplitVars = bool(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  const firebaseInitialized = Array.isArray(admin.apps) && admin.apps.length > 0;

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const payload = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    node: process.version,
    port: process.env.PORT || 'unknown',
    firebase: {
      initialized: firebaseInitialized,
      usingServiceAccount,
      usingSplitVars,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || null
    },
    config: {
      hasMongoUri: bool(process.env.MONGODB_URI || process.env.MONGO_URI),
      hasJwtSecret: bool(process.env.JWT_SECRET),
      hasJwtRefreshSecret: bool(process.env.JWT_REFRESH_SECRET),
      frontendUrl: process.env.FRONTEND_URL || null,
      allowedOrigins
    }
  };

  res.json(payload);
});

module.exports = router;