#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build de producción para Verifireando...\n');

// Función para ejecutar comandos
const runCommand = (command, cwd = process.cwd()) => {
  try {
    console.log(`📦 Ejecutando: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ Comando completado\n');
  } catch (error) {
    console.error(`❌ Error ejecutando: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
};

// Función para verificar archivos
const checkFile = (filePath, description) => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} encontrado: ${filePath}`);
    return true;
  } else {
    console.log(`⚠️  ${description} no encontrado: ${filePath}`);
    return false;
  }
};

// Verificar estructura del proyecto
console.log('🔍 Verificando estructura del proyecto...\n');

const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'frontend');

if (!fs.existsSync(backendPath)) {
  console.error('❌ Carpeta backend no encontrada');
  process.exit(1);
}

if (!fs.existsSync(frontendPath)) {
  console.error('❌ Carpeta frontend no encontrada');
  process.exit(1);
}

// Verificar archivos importantes
console.log('📋 Verificando archivos de configuración...\n');

checkFile(path.join(backendPath, 'package.json'), 'Backend package.json');
checkFile(path.join(backendPath, '.env.production.example'), 'Backend .env.production.example');
checkFile(path.join(frontendPath, 'package.json'), 'Frontend package.json');
checkFile(path.join(frontendPath, '.env.production.example'), 'Frontend .env.production.example');
checkFile(path.join(__dirname, 'DEPLOYMENT.md'), 'Documentación de deployment');

console.log('\n');

// Build del Backend
console.log('🔧 Preparando backend para producción...\n');

// Instalar dependencias del backend
runCommand('npm install --production=false', backendPath);

// Ejecutar linting
console.log('🧹 Ejecutando linting del backend...');
try {
  runCommand('npm run lint', backendPath);
} catch (error) {
  console.log('⚠️  Linting del backend falló, continuando...');
}

// Ejecutar tests si existen
console.log('🧪 Ejecutando tests del backend...');
try {
  runCommand('npm test', backendPath);
} catch (error) {
  console.log('⚠️  Tests del backend fallaron o no existen, continuando...');
}

// Build del Frontend
console.log('🎨 Preparando frontend para producción...\n');

// Instalar dependencias del frontend
runCommand('npm install', frontendPath);

// Ejecutar linting
console.log('🧹 Ejecutando linting del frontend...');
try {
  runCommand('npm run lint', frontendPath);
} catch (error) {
  console.log('⚠️  Linting del frontend falló, continuando...');
}

// Build del frontend
console.log('🏗️  Construyendo frontend para producción...');
runCommand('npm run build', frontendPath);

// Verificar que el build se creó correctamente
const distPath = path.join(frontendPath, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Build del frontend creado exitosamente');
  
  // Mostrar tamaño del build
  try {
    const stats = fs.statSync(distPath);
    console.log(`📊 Carpeta dist creada`);
    
    // Listar archivos principales
    const files = fs.readdirSync(distPath);
    console.log('📁 Archivos en dist:');
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  } catch (error) {
    console.log('⚠️  No se pudo obtener información del build');
  }
} else {
  console.error('❌ Build del frontend falló');
  process.exit(1);
}

// Crear archivo de información del build
const buildInfo = {
  timestamp: new Date().toISOString(),
  version: require('./frontend/package.json').version,
  nodeVersion: process.version,
  environment: 'production',
  backend: {
    path: './backend',
    main: 'app.js'
  },
  frontend: {
    path: './frontend/dist',
    buildTool: 'vite'
  }
};

fs.writeFileSync(
  path.join(__dirname, 'build-info.json'), 
  JSON.stringify(buildInfo, null, 2)
);

console.log('\n🎉 Build de producción completado exitosamente!\n');

console.log('📋 Próximos pasos para deployment:\n');
console.log('1. 📤 Sube la carpeta backend/ a Ámbar Hosting');
console.log('2. 📤 Sube la carpeta frontend/dist/ a Netlify/Vercel');
console.log('3. ⚙️  Configura las variables de entorno según DEPLOYMENT.md');
console.log('4. 🔗 Conecta MongoDB Atlas');
console.log('5. 🔥 Configura Firebase Storage');
console.log('6. 💳 Configura Stripe/MercadoPago');
console.log('7. 🧪 Prueba la aplicación en producción\n');

console.log('📖 Para más detalles, consulta: DEPLOYMENT.md\n');

console.log('✨ ¡Tu aplicación Verifireando está lista para producción! ✨');