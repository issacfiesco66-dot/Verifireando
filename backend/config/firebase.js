const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      // En producción, usar las credenciales del service account
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        logger.info('Firebase inicializado en modo producción');
      } else {
        // Para desarrollo, usar credenciales por defecto o mock
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
  sendPushNotification,
  sendMulticastNotification
};