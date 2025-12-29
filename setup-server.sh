#!/bin/bash

# Script de Configuración Automática para Verifireando en AWS EC2
# Ejecutar en el servidor EC2 después de conectarse por SSH

echo "🚀 Iniciando configuración del servidor Verifireando..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Función para imprimir mensajes
print_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y
print_msg "Sistema actualizado"

# 2. Instalar dependencias básicas
echo "📦 Instalando dependencias..."
sudo apt install -y nginx certbot python3-certbot-nginx nodejs npm git curl wget software-properties-common
print_msg "Dependencias básicas instaladas"

# 3. Instalar Node.js 18 LTS
echo "📦 Instalando Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
print_msg "Node.js 18 instalado"

# 4. Instalar PM2 globalmente
echo "📦 Instalando PM2..."
sudo npm install -g pm2
print_msg "PM2 instalado"

# 5. Instalar UFW firewall
echo "🔒 Configurando firewall..."
sudo apt install -y ufw
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
print_msg "Firewall configurado"

# 6. Crear directorio de la aplicación
echo "📁 Creando directorio de la aplicación..."
sudo mkdir -p /var/www/verifireando
sudo chown ubuntu:ubuntu /var/www/verifireando
print_msg "Directorio creado"

# 7. Verificar instalaciones
echo "🔍 Verificando instalaciones..."
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1)"

# 8. Crear script de despliegue rápido
echo "📝 Creando script de despliegue..."
cat > /var/www/verifireando/deploy.sh << 'EOF'
#!/bin/bash
# Script de despliegue para Verifireando

cd /var/www/verifireando

# Copiar variables de entorno
cp .env.production .env

# Instalar dependencias del backend
npm ci --production

# Construir frontend
cd frontend
npm ci
npm run build
cd ..

# Iniciar aplicación con PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Configurar PM2 para inicio automático
pm2 startup | sudo bash

echo "✅ Aplicación desplegada!"
echo "📊 Verificar estado: pm2 status"
echo "📋 Ver logs: pm2 logs"
EOF

chmod +x /var/www/verifireando/deploy.sh
print_msg "Script de despliegue creado"

# 9. Configurar Nginx básico
echo "🌐 Configurando Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

# Crear configuración temporal para testing
cat > /tmp/nginx-temp.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ =404;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo cp /tmp/nginx-temp.conf /etc/nginx/sites-available/verifireando
sudo ln -s /etc/nginx/sites-available/verifireando /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
print_msg "Nginx configurado"

# 10. Crear página de bienvenida temporal
echo "📝 Creando página de bienvenida..."
sudo tee /var/www/html/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Verifireando - Servidor Configurado!</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .success { color: #4CAF50; font-size: 48px; }
        .info { color: #2196F3; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="success">✅ Servidor Configurado!</div>
    <div class="info">
        <h2>Verifireando está listo para el despliegue</h2>
        <p>Servidor: 18.220.237.118</p>
        <p>Próximos pasos:</p>
        <ol style="text-align: left; display: inline-block;">
            <li>Sube los archivos de la aplicación</li>
            <li>Ejecuta: cd /var/www/verifireando && ./deploy.sh</li>
            <li>Configura tu dominio y SSL</li>
        </ol>
    </div>
</body>
</html>
EOF

# 11. Información final
echo ""
echo "🎉 CONFIGURACIÓN DEL SERVIDOR COMPLETADA!"
echo "======================================"
echo ""
echo "📋 Resumen:"
echo "  - IP del servidor: 18.220.237.118"
echo "  - Directorio de la app: /var/www/verifireando"
echo "  - Nginx configurado en puerto 80"
echo "  - PM2 instalado y listo"
echo ""
echo "🔗 Puedes verificar el servidor en tu navegador:"
echo "  http://18.220.237.118"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Sube tu aplicación al servidor"
echo "  2. Ejecuta: cd /var/www/verifireando && ./deploy.sh"
echo "  3. Configura tu dominio y certificado SSL"
echo ""
print_msg "¡Servidor listo para Verifireando!"
