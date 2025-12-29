// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCCNpyJvoWTBsqCWzk2pWCXzOSV9Zovd3Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "verificandoando-40ad5.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "verificandoando-40ad5",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "verificandoando-40ad5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "579182347944",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:579182347944:web:13e672da1ceeea9779649d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HNTB1DG6GV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in secure context (HTTPS)
let analytics = null;
if (typeof window !== 'undefined') {
  const isSecureContext = window.isSecureContext || 
                          window.location.protocol === 'https:' || 
                          ['localhost', '127.0.0.1'].includes(window.location.hostname);
  
  if (isSecureContext) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      // Analytics no disponible en HTTP
      analytics = null;
    }
  }
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign-In function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Initialize Cloud Messaging only in secure context (HTTPS or localhost)
let messaging = null;
if (typeof window !== 'undefined') {
  // Verificar contexto seguro (HTTPS o localhost)
  const isSecureContext = window.isSecureContext || 
                          window.location.protocol === 'https:' || 
                          ['localhost', '127.0.0.1'].includes(window.location.hostname);
  
  // Solo inicializar en contexto seguro y si serviceWorker está disponible
  if (isSecureContext && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      // Silenciar error completamente - no loguear para evitar ruido en consola
      // En HTTP, messaging permanece null (comportamiento esperado)
      messaging = null;
    }
  }
  // Si no es contexto seguro, messaging permanece null (comportamiento esperado)
}

export { messaging };
export default app;
