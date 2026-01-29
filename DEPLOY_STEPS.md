# 🚀 Guía Paso a Paso para Desplegar Cambios en AWS

Esta guía te ayudará a subir los cambios al servidor AWS y que funcionen en tu dominio.

---

## 📋 PREPARACIÓN LOCAL (Antes de subir)

### 1. Confirmar Cambios
```bash
git status
git add .
git commit -m "Correcciones: modelo User unificado, puertos corregidos, mejoras de logging"
git push origin main
```

---

## 🖥️ PASO 1: Conectarse al Servidor AWS

```bash
# Conectar vía SSH (reemplaza con tu IP o dominio)
ssh -i tu-llave.pem ubuntu@tu-ip-aws

# O si tienes un archivo de configuración SSH:
ssh verifireando-aws
```

---

## 📥 PASO 2: Actualizar el Código en el Servidor

### 2.1 Navegar al Directorio del Proyecto

```bash
# Si tu proyecto está en /home/ubuntu/Verifireando
cd /home/ubuntu/Verifireando

# O si está en otro lugar, encuentra dónde está:
find ~ -name "Verifireando" -type d
```

### 2.2 Obtener los Últimos Cambios

```bash
# Hacer pull de los cambios
git pull origin main

# Si hay conflictos, primero guarda tus cambios locales:
git stash
git pull origin main
git stash pop
```

---

## 🔧 PASO 3: Verificar Configuración del Backend

### 3.1 Verificar que ecosystem.config.js apunta al archivo correcto

```bash
cd /home/ubuntu/Verifireando
cat ecosystem.config.js
```

**Debe apuntar a `server.js`**. Si necesitas corregirlo:

```bash
nano ecosystem.config.js
```

**Cambiar línea 5:**
```javascript
script: './backend/server.js',
```

### 3.2 Verificar Archivo .env

```bash
cd backend
cat .env
```

**Asegúrate de que tenga estas variables críticas:**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://tu-usuario:tu-password@cluster.mongodb.net/verifireando
FRONTEND_URL=https://tu-dominio.com
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
JWT_SECRET=tu-secret-jwt
```

---

## 📦 PASO 4: Instalar Dependencias Actualizadas

### 4.1 Backend

```bash
cd /home/ubuntu/Verifireando/backend
npm install --production
```

### 4.2 Frontend

```bash
cd /home/ubuntu/Verifireando/frontend
npm install
npm run build
```

**Verificar que el build se completó:**
```bash
ls -la dist/
# Debe existir index.html y otros archivos
```

---

## 🔄 PASO 5: Reiniciar la Aplicación

### 5.1 Usando PM2 (Recomendado)

```bash
cd /home/ubuntu/Verifireando

# Reiniciar con la nueva configuración
pm2 restart ecosystem.config.js --update-env

# O reiniciar específicamente el backend
pm2 restart verifireando-backend

# Guardar configuración de PM2
pm2 save

# Verificar estado
pm2 status

# Ver logs en tiempo real
pm2 logs verifireando-backend
```

### 5.2 Si usas systemd (Alternativa)

```bash
sudo systemctl restart verifireando
sudo systemctl status verifireando
```

---

## 🌐 PASO 6: Verificar Nginx (Reverse Proxy)

### 6.1 Verificar Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/verifireando
# O el nombre de tu archivo de configuración
```

**Asegúrate de que apunte al puerto correcto (5000):**

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

    # Frontend
    location / {
        root /home/ubuntu/Verifireando/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### 6.2 Probar y Recargar Nginx

```bash
# Probar configuración
sudo nginx -t

# Si está bien, recargar
sudo systemctl reload nginx

# Verificar estado
sudo systemctl status nginx
```

---

## ✅ PASO 7: Verificar que Todo Funciona

### 7.1 Probar Backend Localmente

```bash
curl http://localhost:5000/api/health
# Debe responder: {"status":"OK",...}
```

### 7.2 Probar a través del Dominio

```bash
curl https://tu-dominio.com/api/health
# Debe responder: {"status":"OK",...}
```

### 7.3 Verificar Frontend

Abre en tu navegador:
- `https://tu-dominio.com` (debe cargar la aplicación)
- `https://tu-dominio.com/api/health` (debe mostrar JSON del backend)

---

## 🔍 PASO 8: Verificación y Troubleshooting

### 8.1 Ver Logs del Backend

```bash
# Con PM2
pm2 logs verifireando-backend --lines 100

# Ver solo errores
pm2 logs verifireando-backend --err --lines 50

# Con systemd
sudo journalctl -u verifireando -n 100 -f
```

### 8.2 Verificar Procesos

```bash
# Ver qué procesos Node están corriendo
ps aux | grep node

# Verificar puerto 5000
sudo netstat -tlnp | grep 5000
# O
sudo lsof -i :5000
```

### 8.3 Verificar Conexión a MongoDB

```bash
# Ver logs del backend para ver si hay errores de conexión
pm2 logs verifireando-backend --err
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema: "Cannot find module" o errores de dependencias

```bash
# Reinstalar dependencias
cd /home/ubuntu/Verifireando/backend
rm -rf node_modules package-lock.json
npm install --production

cd ../frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: Backend no inicia (puerto en uso)

```bash
# Ver qué proceso usa el puerto 5000
sudo lsof -i :5000

# Matar el proceso si es necesario (reemplaza PID con el número)
sudo kill -9 PID

# Reiniciar PM2
pm2 restart verifireando-backend
```

### Problema: Error 502 Bad Gateway

1. Verificar que el backend esté corriendo:
   ```bash
   pm2 status
   ```

2. Verificar que esté escuchando en puerto 5000:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Verificar configuración de Nginx:
   ```bash
   sudo nginx -t
   ```

### Problema: Cambios no se reflejan

```bash
# Limpiar cache del frontend
cd /home/ubuntu/Verifireando/frontend
rm -rf dist
npm run build

# Reiniciar backend
pm2 restart verifireando-backend

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: Error de CORS

Verifica en `backend/.env`:
```env
FRONTEND_URL=https://tu-dominio.com
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
```

Luego reinicia:
```bash
pm2 restart verifireando-backend
```

---

## 📝 CHECKLIST FINAL

- [ ] Código actualizado (`git pull` exitoso)
- [ ] Dependencias instaladas (backend y frontend)
- [ ] Frontend compilado (`npm run build` exitoso)
- [ ] Archivo `.env` configurado correctamente
- [ ] Backend corriendo (`pm2 status` muestra proceso activo)
- [ ] Backend responde en localhost (`curl http://localhost:5000/api/health`)
- [ ] Nginx configurado correctamente
- [ ] Nginx recargado (`sudo systemctl reload nginx`)
- [ ] Backend responde a través del dominio (`curl https://tu-dominio.com/api/health`)
- [ ] Frontend carga correctamente en el navegador
- [ ] Sin errores en los logs (`pm2 logs verifireando-backend`)

---

## 🎯 Script de Despliegue Automático

Puedes usar el script `deploy-aws.sh` que ya existe:

```bash
cd /home/ubuntu/Verifireando
chmod +x deploy-aws.sh
./deploy-aws.sh
```

Este script:
1. Hace `git pull`
2. Instala dependencias del backend
3. Instala dependencias del frontend
4. Compila el frontend
5. Reinicia PM2

---

## 🔐 VERIFICAR SSL (Si es necesario)

Si tu dominio no tiene SSL configurado:

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (ya viene configurada)
sudo certbot renew --dry-run
```

---

## 📞 COMANDOS ÚTILES PARA EL DÍA A DÍA

```bash
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs verifireando-backend

# Reiniciar aplicación
pm2 restart verifireando-backend

# Ver uso de recursos
pm2 monit

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

¡Listo! Tu aplicación debería estar funcionando en producción con todos los cambios aplicados. 🎉
