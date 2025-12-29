#!/bin/bash

# Script de despliegue para Verifireando.com.mx
# Uso: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="verifireando"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_FILE="/var/log/deploy-$APP_NAME.log"

echo "====================================="
echo "Desplegando Verifireando ($ENVIRONMENT)"
echo "====================================="
echo "Fecha: $(date)"
echo "====================================="

# Crear backup si es producción
if [ "$ENVIRONMENT" = "production" ]; then
    echo "📦 Creando backup..."
    mkdir -p $BACKUP_DIR
    tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $APP_DIR .
    echo "✅ Backup creado"
fi

# Navegar al directorio de la app
cd $APP_DIR

# Descargar cambios
echo "📥 Descargando cambios..."
git pull origin main

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
npm ci --production

# Construir frontend
echo "🔨 Construyendo frontend..."
cd frontend
npm ci
npm run build
cd ..

# Migraciones de base de datos si es necesario
echo "🗄️ Ejecutando migraciones..."
# node scripts/migrate.js

# Reiniciar aplicación con PM2
echo "🔄 Reiniciando aplicación..."
if [ "$ENVIRONMENT" = "production" ]; then
    pm2 reload ecosystem.config.js --env production
else
    pm2 reload ecosystem.config.js --env development
fi

# Verificar estado
echo "✅ Verificando estado..."
sleep 5
pm2 status

# Limpiar caché de Nginx
echo "🧹 Limpiando caché..."
sudo nginx -t && sudo systemctl reload nginx

echo "====================================="
echo "✅ Despliegue completado exitosamente"
echo "====================================="
echo "Fecha: $(date)"
echo "====================================="

# Enviar notificación (opcional)
# curl -X POST "https://api.slack.com/..." -d 'text="✅ Verifireando desplegado exitosamente"'
