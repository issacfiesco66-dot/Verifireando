# 📋 Pasos Manuales para Despliegue (si los scripts no funcionan)

## 🔑 Paso 1: Conectarse al servidor
```bash
ssh -i "verifireando-key.pem" ubuntu@18.220.237.118
```

## ⚙️ Paso 2: Configurar servidor (copiar y pegar)
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y nginx certbot python3-certbot-nginx nodejs npm git curl

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Crear directorio
sudo mkdir -p /var/www/verifireando
sudo chown ubuntu:ubuntu /var/www/verifireando
```

## 📤 Paso 3: Subir archivos (desde tu computadora)
```bash
# En otra terminal, desde tu carpeta del proyecto:
scp -i "verifireando-key.pem" -r .env.production ecosystem.config.js nginx-verifireando.conf backend/ frontend/ ubuntu@18.220.237.118:/var/www/verifireando/
```

## 🚀 Paso 4: Desplegar aplicación (en el servidor)
```bash
cd /var/www/verifireando
cp .env.production .env
npm ci --production
cd frontend && npm ci && npm run build && cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup | sudo bash
```

## 🌐 Paso 5: Configurar Nginx
```bash
sudo cp nginx-verifireando.conf /etc/nginx/sites-available/verifireando
sudo ln -s /etc/nginx/sites-available/verifireando /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

## ✅ Listo!
Visita: http://18.220.237.118
