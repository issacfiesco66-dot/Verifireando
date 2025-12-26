# 🚀 Guía de Despliegue a Producción - Verifireando.com.mx

## 📋 Resumen de Configuración Completa

### ✅ Configurado Localmente:
- MongoDB Atlas connection string corregido
- Frontend construido para producción
- Variables de entorno preparadas
- CORS configurado para dominio de producción
- PM2, Nginx, y scripts listos

## 🔧 Pasos para Despliegue en Servidor

### 1. Preparar el Servidor VPS
```bash
# Conectarse al servidor
ssh root@verificandoando.com.mx

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y nginx certbot python3-certbot-nginx nodejs npm git

# Instalar PM2 globalmente
npm install -g pm2

# Crear directorio de la aplicación
mkdir -p /var/www/verifireando
cd /var/www/verifireando
```

### 2. Clonar y Configurar el Proyecto
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/verifireando.git .

# Configurar variables de entorno
cp .env.production.example .env.production
# EDITAR .env.production con valores reales:
# - MONGODB_URI (con contraseña real)
# - JWT_SECRET (el generado)
# - FRONTEND_URL=https://verificandoando.com.mx

# Configurar frontend
cp frontend/.env.production.example frontend/.env.production
# EDITAR si es necesario
```

### 3. Instalar Dependencias y Construir
```bash
# Backend
npm ci --production

# Frontend
cd frontend
npm ci
npm run build
cd ..
```

### 4. Configurar Nginx
```bash
# Copiar configuración
cp nginx-verifireando.conf /etc/nginx/sites-available/verifireando

# Activar sitio
ln -s /etc/nginx/sites-available/verifireando /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Probar configuración
nginx -t
```

### 5. Obtener Certificado SSL
```bash
# Asegúrate que el dominio apunta a la IP del servidor
certbot --nginx -d verificandoando.com.mx -d www.verificandoando.com.mx
```

### 6. Iniciar Aplicación con PM2
```bash
# Iniciar en modo producción
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save
pm2 startup
```

### 7. Verificar Todo Funciona
```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs

# Probar API
curl http://localhost:5000/api/health

# Probar sitio
curl https://verificandoando.com.mx
```

## 📁 Estructura Final en Servidor
```
/var/www/verifireando/
├── backend/
│   ├── app.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── dist/          ← Archivos estáticos servidos por Nginx
│   └── ...
├── .env.production     ← Variables del backend
├── ecosystem.config.js ← Configuración PM2
└── logs/              ← Logs de PM2
```

## 🔐 Consideraciones de Seguridad

### ✅ Implementado:
- Variables de entorno en .gitignore
- Headers de seguridad en Nginx
- Rate limiting en backend
- JWT tokens seguros
- HTTPS con Let's Encrypt

### ⚠️ Recordar:
- Cambiar contraseña de MongoDB (fue expuesta)
- Usar contraseñas fuertes
- Mantener sistema actualizado
- Hacer backups regulares

## 🔄 Para Actualizaciones Futuras

```bash
# En el servidor
cd /var/www/verifireando
git pull
npm ci
cd frontend && npm ci && npm run build && cd ..
pm2 reload ecosystem.config.js --env production
```

## 📊 Monitoreo

```bash
# Ver recursos del sistema
htop
df -h
free -h

# Ver logs de aplicación
pm2 logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Ver estado de SSL
certbot certificates
```

## 🚨 Troubleshooting Común

### Si el sitio no carga:
```bash
# Verificar Nginx
systemctl status nginx
nginx -t

# Verificar PM2
pm2 status
pm2 logs

# Verificar firewall
ufw status
```

### Si la API no responde:
```bash
# Verificar backend
curl http://localhost:5000/api/health

# Verificar variables de entorno
pm2 env 0
```

### Si hay errores de MongoDB:
- Verificar connection string
- Verificar IP whitelist en MongoDB Atlas
- Cambiar contraseña si fue comprometida

## 📞 Contacto de Emergencia

Si algo falla:
1. Revisa los logs: `pm2 logs`
2. Verifica el estado: `pm2 status`
3. Reinicia si es necesario: `pm2 restart all`

## ✅ Checklist Pre-Despliegue

- [ ] Servidor VPS contratado y accesible
- [ ] Dominio verificandoando.com.mx apunta al servidor
- [ ] MongoDB Atlas configurado con IP del servidor
- [ ] Contraseña de MongoDB cambiada
- [ ] Todos los archivos de configuración listos
- [ ] Backup de datos locales (si existe)

¡Listo para desplegar! 🎉
