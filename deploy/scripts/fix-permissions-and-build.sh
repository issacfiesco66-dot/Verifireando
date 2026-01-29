#!/bin/bash

# Script para corregir permisos y hacer build del frontend
# Ejecutar en el servidor: bash deploy/scripts/fix-permissions-and-build.sh

set -e

echo "🔧 Corrigiendo permisos del directorio dist..."
sudo chown -R ubuntu:ubuntu /home/ubuntu/Verifireando/frontend/dist

echo "📦 Ejecutando build del frontend..."
cd /home/ubuntu/Verifireando/frontend
npm run build

echo "✅ Build completado exitosamente!"

# Opcional: cambiar permisos de vuelta si Nginx sirve los archivos
# echo "🔐 Ajustando permisos para Nginx..."
# sudo chown -R www-data:www-data /home/ubuntu/Verifireando/frontend/dist

echo "🔄 Recargando Nginx..."
sudo systemctl reload nginx

echo "✨ ¡Proceso completado!"
