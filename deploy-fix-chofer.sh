#!/bin/bash

# Script de deploy para corregir flujo de registro y login como chofer
# Ejecutar en el servidor: bash deploy-fix-chofer.sh

set -e

echo "🚀 Iniciando deploy de correcciones para registro/login chofer..."

# Ir al directorio del proyecto
cd /home/ubuntu/Verifireando

# Pull de cambios
echo "📥 Obteniendo cambios del repositorio..."
git pull origin master || {
    echo "⚠️  Error al hacer pull. Verificando estado..."
    git status
    echo "💡 Si hay cambios locales, haz stash o commit primero"
    exit 1
}

# Backend
echo "🔧 Instalando dependencias del backend..."
cd backend
npm install

echo "🔄 Reiniciando backend con PM2..."
pm2 restart verifireando-backend || pm2 start ecosystem.config.js --name verifireando-backend

# Frontend
echo "🔧 Instalando dependencias del frontend..."
cd ../frontend
npm install

echo "🏗️  Construyendo frontend..."
# Corregir permisos antes del build
sudo chown -R ubuntu:ubuntu dist 2>/dev/null || true
npm run build

# Ajustar permisos después del build (si Nginx lo necesita)
# sudo chown -R www-data:www-data dist 2>/dev/null || true

# Nginx
echo "🔄 Recargando Nginx..."
sudo systemctl reload nginx

echo "✅ Deploy completado!"
echo ""
echo "📋 Verificación:"
echo "  - Backend: pm2 list | grep verifireando-backend"
echo "  - Frontend: ls -la frontend/dist/index.html"
echo "  - Nginx: sudo systemctl status nginx"
echo ""
echo "🧪 Prueba las siguientes URLs:"
echo "  - Login chofer: https://www.verificandoando.com.mx/auth/login/driver"
echo "  - Registro chofer: https://www.verificandoando.com.mx/auth/register?role=driver"
echo "  - Registro (redirect): https://www.verificandoando.com.mx/register?role=driver"
