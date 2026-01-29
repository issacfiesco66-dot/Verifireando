# 🚀 Guía de Deployment en AWS EC2

## 📋 Pre-requisitos

- [x] Cuenta de AWS activa
- [x] Instancia EC2 creada (Ubuntu 20.04 o superior recomendado)
- [x] MongoDB Atlas configurado
- [x] Dominio configurado (opcional pero recomendado)
- [x] Claves de Stripe (producción)
- [x] WhatsApp Business API configurado

---

## 🖥️ PASO 1: Configurar Instancia EC2

### 1.1 Crear Instancia EC2

1. Ve a AWS Console → EC2 → Launch Instance
2. **Configuración recomendada:**
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Tipo:** t2.medium o superior (2 vCPU, 4GB RAM)
   - **Storage:** 30GB SSD mínimo
   - **Security Group:** Configurar puertos:
     - SSH (22) - Solo tu IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (5000) - 0.0.0.0/0 (temporal, luego cerrar)

### 1.2 Conectar a la Instancia

```bash
ssh -i tu-llave.pem ubuntu@tu-ip-publica
```

---

## 🔧 PASO 2: Configurar Servidor

### 2.1 Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar versión
npm --version
```

### 2.3 Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 startup systemd
# Ejecutar el comando que PM2 te muestre
```

### 2.4 Instalar Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.5 Instalar Git

```bash
sudo apt install -y git
```

---

## 📦 PASO 3: Clonar y Configurar Proyecto

### 3.1 Clonar Repositorio

```bash
cd /home/ubuntu
git clone https://github.com/TU_USUARIO/Verifireando.git
cd Verifireando
```

### 3.2 Crear Archivo .env de Producción

```bash
nano backend/.env
```

**Pega este contenido (REEMPLAZA LOS VALORES):**

```env
# === SERVIDOR ===
NODE_ENV=production
PORT=5000

# === FRONTEND ===
FRONTEND_URL=https://tu-dominio.com
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com

# === MONGODB ATLAS (REQUERIDO) ===
MONGO_URI=mongodb+srv://TU_USUARIO:TU_PASSWORD@TU_CLUSTER.mongodb.net/verifireando?retryWrites=true&w=majority

# === JWT SECRETS ===
JWT_SECRET=GENERATE_STRONG_JWT_SECRET
JWT_REFRESH_SECRET=GENERATE_STRONG_REFRESH_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# === STRIPE (PRODUCCIÓN - CAMBIAR A CLAVES LIVE) ===
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_SECRETA
STRIPE_PUBLISHABLE_KEY=pk_live_TU_CLAVE_PUBLICA
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET

# === WHATSAPP BUSINESS API (CRÍTICO) ===
WHATSAPP_API_KEY=TU_WHATSAPP_API_KEY
WHATSAPP_PHONE_NUMBER_ID=TU_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=TU_BUSINESS_ACCOUNT_ID
WHATSAPP_MOCK_MODE=false

# === SECURITY ===
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=GENERATE_STRONG_SESSION_SECRET

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# === LOGGING ===
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# === APP CONFIGURATION ===
APP_NAME=Verifireando
APP_VERSION=1.0.0
SUPPORT_EMAIL=soporte@verifireando.com
SUPPORT_PHONE=+525512345678

# === BUSINESS ===
PLATFORM_FEE_PERCENTAGE=10
PROCESSING_FEE_PERCENTAGE=3
DEFAULT_CURRENCY=MXN
DEFAULT_TIMEZONE=America/Mexico_City

# === OTP ===
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
MAX_OTP_ATTEMPTS=3
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`

### 3.3 Instalar Dependencias

```bash
# Backend
cd backend
npm install --production
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..
```

---

## 🚀 PASO 4: Iniciar Aplicación con PM2

### 4.1 Iniciar Backend

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 list
```

### 4.2 Ver Logs

```bash
pm2 logs verifireando-backend
```

### 4.3 Verificar que Funciona

```bash
curl http://localhost:5000/health
# Debe responder: {"status":"ok"}
```

---

## 🌐 PASO 5: Configurar Nginx como Reverse Proxy

### 5.1 Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/verifireando
```

**Pega este contenido:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Backend API
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

    # Frontend (archivos estáticos)
    location / {
        root /home/ubuntu/Verifireando/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### 5.2 Activar Configuración

```bash
sudo ln -s /etc/nginx/sites-available/verifireando /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 PASO 6: Configurar SSL con Let's Encrypt

### 6.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtener Certificado SSL

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Sigue las instrucciones. Certbot configurará automáticamente HTTPS.

### 6.3 Renovación Automática

```bash
sudo certbot renew --dry-run
```

---

## ✅ PASO 7: Verificación Final

### 7.1 Verificar Backend

```bash
curl https://tu-dominio.com/api/health
```

### 7.2 Verificar Frontend

Abre en navegador: `https://tu-dominio.com`

### 7.3 Verificar PM2

```bash
pm2 status
pm2 logs verifireando-backend --lines 50
```

---

## 🔄 PASO 8: Deployment Continuo

### 8.1 Hacer el Script Ejecutable

```bash
chmod +x deploy-aws.sh
```

### 8.2 Para Actualizar la Aplicación

```bash
./deploy-aws.sh
```

Este script:
- Hace pull del código
- Instala dependencias
- Compila el frontend
- Reinicia PM2

---

## 📊 Comandos Útiles de PM2

```bash
# Ver logs en tiempo real
pm2 logs verifireando-backend

# Ver estado
pm2 status

# Reiniciar
pm2 restart verifireando-backend

# Detener
pm2 stop verifireando-backend

# Ver métricas
pm2 monit

# Ver logs de errores
pm2 logs verifireando-backend --err

# Limpiar logs
pm2 flush
```

---

## 🔍 Troubleshooting

### Backend no inicia

```bash
pm2 logs verifireando-backend --err
# Revisar errores de conexión a MongoDB o variables faltantes
```

### Error de conexión a MongoDB

1. Verifica el MONGO_URI en `.env`
2. Asegúrate de que la IP del servidor AWS esté en el whitelist de MongoDB Atlas
3. En MongoDB Atlas → Network Access → Add IP Address → Add Current IP Address

### Error 502 Bad Gateway

```bash
sudo systemctl status nginx
pm2 status
# Verificar que el backend esté corriendo en puerto 5000
```

### Cambios no se reflejan

```bash
./deploy-aws.sh
# O manualmente:
git pull
cd frontend && npm run build && cd ..
pm2 restart verifireando-backend
```

---

## 🎯 Checklist Final

- [ ] Instancia EC2 configurada y corriendo
- [ ] Node.js 20 instalado
- [ ] PM2 instalado y configurado
- [ ] Nginx instalado y configurado
- [ ] Repositorio clonado
- [ ] Archivo .env creado con valores reales
- [ ] Dependencias instaladas
- [ ] Backend corriendo con PM2
- [ ] Nginx configurado como reverse proxy
- [ ] SSL configurado con Let's Encrypt
- [ ] MongoDB Atlas whitelist configurado
- [ ] Stripe webhooks configurados
- [ ] WhatsApp API configurado
- [ ] Pruebas de registro y login funcionando
- [ ] Pruebas de pagos funcionando

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs verifireando-backend`
2. Verifica el estado: `pm2 status`
3. Revisa Nginx: `sudo nginx -t`
4. Verifica conectividad a MongoDB Atlas

---

**¡Tu aplicación Verifireando está lista para producción!** 🎉
