#!/bin/bash

# Script para configurar SSL con Let's Encrypt en el servidor EC2
# Ejecutar como: sudo bash setup-ssl.sh

echo "🔒 Configurando SSL para verificandoando.com.mx..."

# 1. Instalar Certbot
echo "📦 Instalando Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# 2. Obtener certificado SSL
echo "🔑 Obteniendo certificado SSL..."
certbot --nginx -d www.verificandoando.com.mx -d verificandoando.com.mx \
  --non-interactive --agree-tos --email andamosprobando@gmail.com \
  --redirect

# 3. Configurar renovación automática
echo "♻️ Configurando renovación automática..."
systemctl enable certbot.timer
systemctl start certbot.timer

# 4. Actualizar configuración de Nginx para HTTPS
cat > /etc/nginx/sites-available/verifireando << 'EOF'
# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name www.verificandoando.com.mx verificandoando.com.mx;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name www.verificandoando.com.mx verificandoando.com.mx;

    # Certificados SSL (Certbot los configurará automáticamente)
    ssl_certificate /etc/letsencrypt/live/www.verificandoando.com.mx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.verificandoando.com.mx/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/html;
    index index.html;

    # Service Worker - serve with correct MIME type
    location = /sw.js {
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
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

    # Socket.IO Proxy with WebSocket support
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_buffering off;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 5. Verificar configuración
echo "✅ Verificando configuración de Nginx..."
nginx -t

# 6. Reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
systemctl restart nginx

# 7. Verificar estado del firewall
echo "🔥 Configurando firewall..."
ufw allow 443/tcp
ufw status

echo "✅ ¡SSL configurado correctamente!"
echo "🌐 Tu sitio ahora está disponible en:"
echo "   https://www.verificandoando.com.mx"
echo "   https://verificandoando.com.mx"
