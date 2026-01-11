const fs = require('fs');
const path = require('path');

// Archivos PWA que deben estar en la raíz de dist/
const pwaFiles = [
  'sw.js',
  'manifest.webmanifest',
  'logo.svg',
  'icon-192.svg',
  'icon-512.svg',
  'firebase-messaging-sw.js'
];

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
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copiado: ${file}`);
      copied++;
    } catch (error) {
      console.error(`❌ Error copiando ${file}:`, error.message);
    }
  } else {
    console.warn(`⚠️  Archivo no encontrado en public/: ${file}`);
  }
});

console.log(`\n✅ ${copied}/${pwaFiles.length} archivos PWA copiados a dist/`);
