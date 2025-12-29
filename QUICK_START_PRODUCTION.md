# ⚡ INICIO RÁPIDO - PRODUCCIÓN

## 🎯 Pasos Mínimos para Producción

### 1️⃣ **MongoDB Atlas** (5 minutos)

1. Ve a https://cloud.mongodb.com
2. Crea un cluster gratuito (M0)
3. Database Access → Add User → Crea usuario y contraseña
4. Network Access → Add IP → **0.0.0.0/0** (permitir todas las IPs)
5. Copia el connection string:
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/verifireando
   ```

### 2️⃣ **Conectar a AWS** (2 minutos)

```bash
ssh -i tu-llave.pem ubuntu@TU_IP_AWS
```

### 3️⃣ **Instalar Dependencias** (5 minutos)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 y Nginx
sudo npm install -g pm2
sudo apt install -y nginx git

# Configurar PM2 para auto-inicio
pm2 startup systemd
# Ejecutar el comando que PM2 te muestre
```

### 4️⃣ **Clonar Proyecto** (2 minutos)

```bash
cd /home/ubuntu
git clone https://github.com/TU_USUARIO/Verifireando.git
cd Verifireando
```

### 5️⃣ **Configurar Variables de Entorno** (3 minutos)

```bash
nano backend/.env
```

**Pega esto (REEMPLAZA los valores marcados):**

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://TU_IP_AWS
ALLOWED_ORIGINS=http://TU_IP_AWS

# MongoDB Atlas - REEMPLAZAR
MONGO_URI=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/verifireando

# Secrets generados (del archivo SECRETS_GENERATED.txt)
JWT_SECRET=OX9yjqB3bihumYZCEgQfA5zTFdocaGtNpJvDkML04xVSI1KWR7rn86PUH2eswl
JWT_REFRESH_SECRET=NtqVEZ6bvAaQTizhl1YBg5GeSRWyuUkxfsIp0KDCcPLw2r3d78omj4OXFJnM9H
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Stripe (usar tus claves de Stripe)
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_pendiente

# WhatsApp (modo mock para pruebas iniciales)
WHATSAPP_MOCK_MODE=true

# Security
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=iClx9BVGRTa3wDtNsrEoKUzgm7JjpdHvY2unA085X6WfOSZqke1bLhFI4cMrPXw

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# App
APP_NAME=Verifireando
APP_VERSION=1.0.0
SUPPORT_EMAIL=soporte@verifireando.com
SUPPORT_PHONE=+525512345678

# Business
PLATFORM_FEE_PERCENTAGE=10
PROCESSING_FEE_PERCENTAGE=3
DEFAULT_CURRENCY=MXN
DEFAULT_TIMEZONE=America/Mexico_City

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
MAX_OTP_ATTEMPTS=3
```

Guarda: `Ctrl+X` → `Y` → `Enter`

### 6️⃣ **Configurar Frontend** (2 minutos)

```bash
nano frontend/.env.production
```

**Pega esto:**

```env
VITE_API_URL=http://TU_IP_AWS/api
VITE_SOCKET_URL=http://TU_IP_AWS
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SeGr752SYy52bSBbS6TLH6JQdZkTz69YtsI4nxJzZBsFxFtR1kA8vZQBulRosCEyMJrCVwprs1jg7JfcLBp7FzC00WtPyphl0
VITE_APP_NAME=Verifireando
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

Guarda: `Ctrl+X` → `Y` → `Enter`

### 7️⃣ **Instalar y Compilar** (5 minutos)

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

### 8️⃣ **Iniciar con PM2** (1 minuto)

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 list
```

### 9️⃣ **Configurar Nginx** (2 minutos)

```bash
# Copiar configuración
sudo cp nginx.conf /etc/nginx/sites-available/verifireando

# Editar para poner la ruta correcta
sudo nano /etc/nginx/sites-available/verifireando
# Cambiar: root /home/ubuntu/Verifireando/frontend/dist;

# Activar
sudo ln -s /etc/nginx/sites-available/verifireando /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 🔟 **Verificar** (1 minuto)

```bash
# Backend
curl http://localhost:5000/health

# Ver logs
pm2 logs verifireando-backend

# Abrir en navegador
# http://TU_IP_AWS
```

---

## ✅ LISTO PARA PRUEBAS

Tu aplicación está corriendo en: **http://TU_IP_AWS**

### 🧪 Pruebas Básicas

1. **Registro de Usuario:**
   - Ve a http://TU_IP_AWS/auth/register
   - Registra un usuario cliente
   - El OTP aparecerá en los logs: `pm2 logs verifireando-backend`

2. **Login:**
   - Usa el código OTP de los logs
   - Deberías entrar al dashboard

3. **Crear Cita:**
   - Agrega un vehículo
   - Crea una cita de verificación
   - Procede al pago con tarjeta de prueba: `4242 4242 4242 4242`

---

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs verifireando-backend

# Reiniciar aplicación
pm2 restart verifireando-backend

# Ver estado
pm2 status

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## ⚠️ IMPORTANTE ANTES DE PRODUCCIÓN REAL

### Pendientes Críticos:

1. **WhatsApp Business API:**
   - Actualmente en modo mock
   - Los OTPs aparecen en logs del servidor
   - Para producción real, configura WhatsApp Business API

2. **Stripe Producción:**
   - Cambiar a claves LIVE cuando vayas a cobrar de verdad
   - Configurar webhooks en Stripe Dashboard

3. **Dominio y SSL:**
   - Configura un dominio real
   - Instala SSL con Let's Encrypt:
     ```bash
     sudo apt install certbot python3-certbot-nginx
     sudo certbot --nginx -d tu-dominio.com
     ```

4. **Firewall:**
   - Cierra puerto 5000 en AWS Security Groups
   - Solo deja abiertos: 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## 📊 Tiempo Total: ~30 minutos

¡Tu aplicación Verifireando está lista para pruebas en producción! 🎉
