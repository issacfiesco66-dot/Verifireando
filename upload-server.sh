#!/bin/bash

# Script para subir archivos al servidor EC2
# Ejecutar en tu computadora local (Windows PowerShell o Mac/Linux Terminal)

# Configuración
SERVER_IP="18.220.237.118"
KEY_FILE="verifireando-key.pem"  # Cambia esto si tu key tiene otro nombre
REMOTE_DIR="/var/www/verifireando"

echo "🚀 Subiendo Verifireando al servidor AWS..."

# Verificar que existe la key
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: No se encuentra el archivo de clave $KEY_FILE"
    echo "   Asegúrate de que el archivo está en la misma carpeta"
    exit 1
fi

# 1. Subir el script de configuración
echo "📤 Subiendo script de configuración..."
scp -i "$KEY_FILE" setup-server.sh ubuntu@$SERVER_IP:/tmp/

# 2. Ejecutar el script de configuración
echo "⚙️  Ejecutando configuración automática..."
ssh -i "$KEY_FILE" ubuntu@$SERVER_IP "bash /tmp/setup-server.sh"

# 3. Subir los archivos de la aplicación
echo "📤 Subiendo archivos de la aplicación..."
scp -i "$KEY_FILE" -r .env.production ecosystem.config.js nginx-verifireando.conf deploy.sh ubuntu@$SERVER_IP:$REMOTE_DIR/
scp -i "$KEY_FILE" -r backend/ ubuntu@$SERVER_IP:$REMOTE_DIR/
scp -i "$KEY_FILE" -r frontend/ ubuntu@$SERVER_IP:$REMOTE_DIR/

# 4. Ejecutar el despliegue
echo "🚀 Ejecutando despliegue..."
ssh -i "$KEY_FILE" ubuntu@$SERVER_IP "cd $REMOTE_DIR && ./deploy.sh"

# 5. Verificar estado
echo "📊 Verificando estado..."
ssh -i "$KEY_FILE" ubuntu@$SERVER_IP "pm2 status"

echo ""
echo "✅ ¡Verifireando desplegado!"
echo "🌐 Visita: http://$SERVER_IP"
echo ""
echo "📋 Comandos útiles:"
echo "  Ver logs: ssh -i $KEY_FILE ubuntu@$SERVER_IP 'pm2 logs'"
echo "  Reiniciar: ssh -i $KEY_FILE ubuntu@$SERVER_IP 'pm2 restart all'"
