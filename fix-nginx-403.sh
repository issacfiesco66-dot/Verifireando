#!/bin/bash

# Script para diagnosticar y corregir error 403 en Nginx
# Ejecutar en el servidor: bash fix-nginx-403.sh

set -e

echo "🔍 Diagnóstico de error 403 en Nginx..."
echo ""

# Verificar qué configuración de Nginx está activa
echo "📋 Configuración activa de Nginx:"
sudo nginx -T 2>/dev/null | grep -A 5 "server_name.*verificandoando" || echo "No se encontró configuración específica"

echo ""
echo "📁 Verificando directorios:"

# Verificar directorio según nginx.conf
DIST_DIR1="/home/ubuntu/Verifireando/frontend/dist"
DIST_DIR2="/var/www/verificandoando/frontend/dist"

if [ -d "$DIST_DIR1" ]; then
    echo "✅ Directorio existe: $DIST_DIR1"
    ls -la "$DIST_DIR1" | head -5
    if [ -f "$DIST_DIR1/index.html" ]; then
        echo "✅ index.html existe"
    else
        echo "❌ index.html NO existe en $DIST_DIR1"
    fi
else
    echo "❌ Directorio NO existe: $DIST_DIR1"
fi

if [ -d "$DIST_DIR2" ]; then
    echo "✅ Directorio existe: $DIST_DIR2"
    ls -la "$DIST_DIR2" | head -5
    if [ -f "$DIST_DIR2/index.html" ]; then
        echo "✅ index.html existe"
    else
        echo "❌ index.html NO existe en $DIST_DIR2"
    fi
else
    echo "❌ Directorio NO existe: $DIST_DIR2"
fi

echo ""
echo "🔧 Corrigiendo permisos..."

# Corregir permisos en ambos directorios si existen
if [ -d "$DIST_DIR1" ]; then
    echo "Ajustando permisos en $DIST_DIR1..."
    sudo chown -R ubuntu:ubuntu "$DIST_DIR1"
    sudo chmod -R 755 "$DIST_DIR1"
    # Si Nginx necesita acceso, también dar permisos a www-data
    sudo chown -R www-data:www-data "$DIST_DIR1" 2>/dev/null || sudo chmod -R 755 "$DIST_DIR1"
fi

if [ -d "$DIST_DIR2" ]; then
    echo "Ajustando permisos en $DIST_DIR2..."
    sudo chown -R www-data:www-data "$DIST_DIR2"
    sudo chmod -R 755 "$DIST_DIR2"
fi

echo ""
echo "🔄 Verificando configuración de Nginx..."
sudo nginx -t

echo ""
echo "🔄 Recargando Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Proceso completado!"
echo ""
echo "📋 Verificación final:"
echo "  - Verifica que el sitio carga: https://www.verificandoando.com.mx"
echo "  - Revisa logs de Nginx: sudo tail -f /var/log/nginx/error.log"
