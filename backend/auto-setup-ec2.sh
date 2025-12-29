#!/bin/bash

# Script automático para configurar EC2 con MongoDB Atlas
# Ejecutar: bash auto-setup-ec2.sh

echo "🚀 CONFIGURACIÓN AUTOMÁTICA DE EC2"
echo "===================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables - REEMPLAZAR CON TUS VALORES
MONGODB_URI="REEMPLAZAR_CON_TU_URI_DE_ATLAS"
PROJECT_PATH="/home/ubuntu/verifireando/backend"  # Ajustar si es diferente

echo "📋 Configuración:"
echo "   MongoDB URI: ${MONGODB_URI:0:30}..."
echo "   Ruta del proyecto: $PROJECT_PATH"
echo ""

# Verificar que estamos en el servidor correcto
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}❌ Error: No se encuentra el proyecto en $PROJECT_PATH${NC}"
    echo "Por favor, actualiza la variable PROJECT_PATH en este script"
    exit 1
fi

# Navegar al directorio del proyecto
cd $PROJECT_PATH

# Paso 1: Backup del .env actual
echo -e "${YELLOW}1️⃣  Haciendo backup del .env actual...${NC}"
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}   ✅ Backup creado${NC}"
else
    echo -e "${YELLOW}   ⚠️  No existe .env, se creará uno nuevo${NC}"
fi

# Paso 2: Actualizar/Crear .env
echo -e "${YELLOW}2️⃣  Actualizando variables de entorno...${NC}"

# Crear o actualizar .env
cat > .env << EOF
# Base de Datos
MONGODB_URI=$MONGODB_URI

# Entorno
NODE_ENV=production
PORT=5000

# Seguridad
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Frontend
FRONTEND_URL=https://www.verificandoando.com.mx
ALLOWED_ORIGINS=https://www.verificandoando.com.mx,https://verificandoando.com.mx

# Configuración adicional
SERVE_FRONTEND=false
EOF

echo -e "${GREEN}   ✅ Variables de entorno actualizadas${NC}"

# Paso 3: Verificar que Node.js y npm están instalados
echo -e "${YELLOW}3️⃣  Verificando dependencias...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}   ❌ Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Node.js: $(node --version)${NC}"
echo -e "${GREEN}   ✅ npm: $(npm --version)${NC}"

# Paso 4: Instalar/actualizar dependencias
echo -e "${YELLOW}4️⃣  Instalando dependencias...${NC}"
npm install --production
echo -e "${GREEN}   ✅ Dependencias instaladas${NC}"

# Paso 5: Detectar cómo está corriendo la aplicación
echo -e "${YELLOW}5️⃣  Detectando process manager...${NC}"

if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}   ✅ PM2 detectado${NC}"
    PROCESS_MANAGER="pm2"
elif systemctl list-units --type=service | grep -q verifireando; then
    echo -e "${GREEN}   ✅ systemd detectado${NC}"
    PROCESS_MANAGER="systemd"
else
    echo -e "${YELLOW}   ⚠️  No se detectó process manager${NC}"
    PROCESS_MANAGER="manual"
fi

# Paso 6: Reiniciar la aplicación
echo -e "${YELLOW}6️⃣  Reiniciando aplicación...${NC}"

case $PROCESS_MANAGER in
    pm2)
        pm2 restart verifireando || pm2 start app.js --name verifireando
        echo -e "${GREEN}   ✅ Aplicación reiniciada con PM2${NC}"
        ;;
    systemd)
        sudo systemctl restart verifireando
        echo -e "${GREEN}   ✅ Aplicación reiniciada con systemd${NC}"
        ;;
    manual)
        echo -e "${YELLOW}   ⚠️  Reinicio manual requerido${NC}"
        echo "   Ejecuta: npm start"
        ;;
esac

# Paso 7: Esperar a que la app inicie
echo -e "${YELLOW}7️⃣  Esperando a que la aplicación inicie...${NC}"
sleep 5

# Paso 8: Verificar que la aplicación está corriendo
echo -e "${YELLOW}8️⃣  Verificando estado...${NC}"

# Verificar health check local
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}   ✅ Health check: OK${NC}"
else
    echo -e "${RED}   ❌ Health check: FALLO${NC}"
fi

# Verificar conexión a MongoDB
DB_STATUS=$(curl -s http://localhost:5000/api/diagnostics | grep -o '"connected":[^,]*' | cut -d':' -f2)
if [ "$DB_STATUS" == "true" ]; then
    echo -e "${GREEN}   ✅ MongoDB: Conectado${NC}"
else
    echo -e "${RED}   ❌ MongoDB: No conectado${NC}"
fi

# Paso 9: Mostrar logs recientes
echo ""
echo -e "${YELLOW}9️⃣  Logs recientes:${NC}"
echo "=================================="

case $PROCESS_MANAGER in
    pm2)
        pm2 logs verifireando --lines 20 --nostream
        ;;
    systemd)
        sudo journalctl -u verifireando -n 20 --no-pager
        ;;
    manual)
        if [ -f output.log ]; then
            tail -20 output.log
        fi
        ;;
esac

# Resumen final
echo ""
echo "=================================="
echo -e "${GREEN}✅ CONFIGURACIÓN COMPLETADA${NC}"
echo "=================================="
echo ""
echo "📊 Próximos pasos:"
echo "   1. Verifica: https://www.verificandoando.com.mx/api/diagnostics"
echo "   2. Verifica: https://www.verificandoando.com.mx/api/services"
echo "   3. Prueba registro desde tu app móvil"
echo ""
echo "📝 Ver logs en tiempo real:"
case $PROCESS_MANAGER in
    pm2)
        echo "   pm2 logs verifireando --lines 100"
        ;;
    systemd)
        echo "   sudo journalctl -u verifireando -f"
        ;;
esac
echo ""
