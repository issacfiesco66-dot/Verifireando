const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      // Modo 1: variable FIREBASE_SERVICE_ACCOUNT con JSON completo
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          const bucket = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
          firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: bucket
          });
          logger.info('Firebase inicializado en modo producción (JSON Service Account)');
        } catch (jsonErr) {
          logger.error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido:', jsonErr);
        }
      }
      
      // Modo 2: variables separadas (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)
      if (!firebaseApp && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
          const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
          const credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey
          });
          const bucket = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
          firebaseApp = admin.initializeApp({
            credential,
            storageBucket: bucket
          });
          logger.info('Firebase inicializado en modo producción (vars individuales)');
        } catch (certErr) {
          logger.error('Error al inicializar Firebase con certificado:', certErr);
        }
      }

      // Modo desarrollo/mocking si no hay credenciales reales
      if (!firebaseApp) {
        logger.info('Firebase configurado en modo desarrollo (mock)');
        firebaseApp = {
          messaging: () => ({
            send: async (message) => {
              logger.debug('Mock FCM message:', message);
              return { messageId: 'mock-' + Date.now() };
            },
            sendMulticast: async (message) => {
              logger.debug('Mock FCM multicast:', message);
              return { 
                successCount: message.tokens.length,
                failureCount: 0,
                responses: message.tokens.map(() => ({ success: true }))
              };
            }
          })
        };
      }
    }
    return firebaseApp;
  } catch (error) {
    logger.error('Error inicializando Firebase:', error);
    return null;
  }
};

const getFirebaseApp = () => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

// Nuevo: verificación de ID Tokens de Firebase
const verifyFirebaseIdToken = async (idToken) => {
  try {
    // Verificar que admin esté inicializado con credenciales reales
    if (!admin.apps || admin.apps.length === 0) {
      logger.warn('Firebase Admin no inicializado; no se puede verificar ID Token');
      return null;
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (error) {
    logger.error('Error verificando Firebase ID Token:', error);
    return null;
  }
};

const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    const app = getFirebaseApp();
    if (!app || !app.messaging) {
      logger.info('Firebase no disponible, simulando notificación push');
      return { success: true, messageId: 'mock-' + Date.now() };
    }

    const message = {
      notification: {
        title,
        body
      },
      data,
      token
    };

    const response = await app.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('Error enviando notificación push:', error);
    return { success: false, error: error.message };
  }
};

const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  try {
    const app = getFirebaseApp();
    if (!app || !app.messaging) {
      logger.info('Firebase no disponible, simulando notificación multicast');
      return { 
        successCount: tokens.length,
        failureCount: 0,
        responses: tokens.map(() => ({ success: true }))
      };
    }

    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens
    };

    const response = await app.messaging().sendMulticast(message);
    return response;
  } catch (error) {
    logger.error('Error enviando notificación multicast:', error);
    return { successCount: 0, failureCount: tokens.length, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  verifyFirebaseIdToken,
  sendPushNotification,
  sendMulticastNotification
};