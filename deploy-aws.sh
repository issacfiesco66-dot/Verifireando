#!/bin/bash

# ========================================
# Script de Deployment para AWS EC2
# ========================================

echo "🚀 Iniciando deployment de Verifireando..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encuentra package.json${NC}"
    exit 1
fi

# 1. Actualizar código desde Git
echo -e "${YELLOW}📥 Actualizando código desde Git...${NC}"
git pull origin main

# 2. Instalar dependencias del backend
echo -e "${YELLOW}📦 Instalando dependencias del backend...${NC}"
cd backend
npm install --production
cd ..

# 3. Instalar dependencias del frontend
echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
cd frontend
npm install
cd ..

# 4. Build del frontend
echo -e "${YELLOW}🔨 Compilando frontend...${NC}"
cd frontend
npm run build
cd ..

# 5. Verificar que existe el archivo .env
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: No existe backend/.env${NC}"
    echo -e "${YELLOW}Por favor crea el archivo .env con las variables de producción${NC}"
    exit 1
fi

# 6. Crear directorio de logs si no existe
mkdir -p logs

# 7. Reiniciar aplicación con PM2
echo -e "${YELLOW}🔄 Reiniciando aplicación con PM2...${NC}"
pm2 restart ecosystem.config.js --update-env

# 8. Guardar configuración de PM2
pm2 save

# 9. Verificar estado
echo -e "${YELLOW}📊 Estado de la aplicación:${NC}"
pm2 status

echo -e "${GREEN}✅ Deployment completado!${NC}"
echo -e "${GREEN}🌍 Backend corriendo en puerto 5000${NC}"
echo -e "${GREEN}📊 Verifica el estado con: pm2 logs verifireando-backend${NC}"
