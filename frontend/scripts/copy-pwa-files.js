import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos PWA que deben estar en la raíz de dist/
const pwaFiles = [
  'sw.js',
  'manifest.webmanifest',
  'logo.svg',
  'icon-192.svg',
  'icon-512.svg',
  'firebase-messaging-sw.js'
];

// Contenido de los archivos PWA (fallback si no existen en public/)
const pwaFileContents = {
  'sw.js': `// Minimal Service Worker to enable PWA features
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  self.clients.claim()
})

self.addEventListener('fetch', () => {})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})`,
  'manifest.webmanifest': `{
  "name": "Verifireando",
  "short_name": "Verifireando",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#00AEEF",
  "icons": [
    {
      "src": "/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ]
}`,
  'logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="96" cy="96" r="88" fill="url(#gradient)" stroke="#ffffff" stroke-width="4"/>
  <rect x="40" y="80" width="112" height="40" rx="8" fill="#ffffff"/>
  <path d="M 60 80 L 80 60 L 112 60 L 132 80 Z" fill="#ffffff"/>
  <rect x="65" y="65" width="20" height="12" rx="2" fill="#667eea"/>
  <rect x="107" y="65" width="20" height="12" rx="2" fill="#667eea"/>
  <circle cx="65" cy="125" r="12" fill="#333333"/>
  <circle cx="127" cy="125" r="12" fill="#333333"/>
  <circle cx="65" cy="125" r="6" fill="#666666"/>
  <circle cx="127" cy="125" r="6" fill="#666666"/>
  <circle cx="96" cy="96" r="20" fill="#22c55e" opacity="0.9"/>
  <path d="M 88 96 L 94 102 L 104 88" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="96" y="155" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">VERIFICADO</text>
</svg>`,
  'icon-192.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="96" cy="96" r="88" fill="url(#gradient)" stroke="#ffffff" stroke-width="4"/>
  <rect x="40" y="80" width="112" height="40" rx="8" fill="#ffffff"/>
  <path d="M 60 80 L 80 60 L 112 60 L 132 80 Z" fill="#ffffff"/>
  <rect x="65" y="65" width="20" height="12" rx="2" fill="#667eea"/>
  <rect x="107" y="65" width="20" height="12" rx="2" fill="#667eea"/>
  <circle cx="65" cy="125" r="12" fill="#333333"/>
  <circle cx="127" cy="125" r="12" fill="#333333"/>
  <circle cx="65" cy="125" r="6" fill="#666666"/>
  <circle cx="127" cy="125" r="6" fill="#666666"/>
  <circle cx="96" cy="96" r="20" fill="#22c55e" opacity="0.9"/>
  <path d="M 88 96 L 94 102 L 104 88" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="96" y="155" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">VERIFICADO</text>
</svg>`,
  'icon-512.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#gradient)" stroke="#ffffff" stroke-width="12"/>
  <rect x="120" y="220" width="272" height="100" rx="20" fill="#ffffff"/>
  <path d="M 160 220 L 210 160 L 302 160 L 352 220 Z" fill="#ffffff"/>
  <rect x="175" y="175" width="50" height="30" rx="5" fill="#667eea"/>
  <rect x="287" y="175" width="50" height="30" rx="5" fill="#667eea"/>
  <circle cx="175" cy="340" r="32" fill="#333333"/>
  <circle cx="337" cy="340" r="32" fill="#333333"/>
  <circle cx="175" cy="340" r="16" fill="#666666"/>
  <circle cx="337" cy="340" r="16" fill="#666666"/>
  <circle cx="256" cy="256" r="55" fill="#22c55e" opacity="0.9"/>
  <path d="M 230 256 L 248 274 L 282 230" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="256" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff">VERIFICADO</text>
</svg>`,
  'firebase-messaging-sw.js': `// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: "AIzaSyAmY6g_cmgMFoRNI-Mfk99X4n1De7C8oBs",
  authDomain: "verifireando.firebaseapp.com",
  projectId: "verifireando",
  storageBucket: "verifireando.firebasestorage.app",
  messagingSenderId: "912536682949",
  appId: "1:912536682949:web:8cf0eca4541307b84f4bac"
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Verifireando'
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: payload.data?.tag || 'default',
    data: payload.data || {}
  }
  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
  } else {
    event.waitUntil(clients.openWindow('/'))
  }
})`
};

const publicDir = path.join(__dirname, '../public');
const distDir = path.join(__dirname, '../dist');

// Verificar que dist/ existe
if (!fs.existsSync(distDir)) {
  console.error('❌ Error: El directorio dist/ no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

// Copiar archivos PWA
let copied = 0;
pwaFiles.forEach(file => {
  const sourcePath = path.join(publicDir, file);
  const destPath = path.join(distDir, file);
  
  try {
    // Intentar copiar desde public/ si existe
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copiado desde public/: ${file}`);
      copied++;
    } else if (pwaFileContents[file]) {
      // Si no existe en public/, crear desde el contenido fallback
      fs.writeFileSync(destPath, pwaFileContents[file], 'utf8');
      console.log(`✅ Creado desde fallback: ${file}`);
      copied++;
    } else {
      console.warn(`⚠️  Archivo no encontrado y sin fallback: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error copiando/creando ${file}:`, error.message);
  }
});

console.log(`\n✅ ${copied}/${pwaFiles.length} archivos PWA copiados/creados en dist/`);
