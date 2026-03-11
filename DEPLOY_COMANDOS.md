# Comandos de Deploy - Registro Separado Cliente/Chofer

## 🚀 Deploy Rápido (Script Automático)

```bash
# Conectarse al servidor
ssh ubuntu@tu-servidor

# Ir al directorio del proyecto
cd /home/ubuntu/Verifireando

# Hacer commit y push de los cambios locales primero (si es necesario)
git add .
git commit -m "Separar registro cliente/chofer y corregir Google Sign-In"
git push origin master

# Ejecutar script de deploy
bash deploy-registro-separado.sh
```

## 📝 Deploy Manual (Paso a Paso)

Si prefieres ejecutar los comandos manualmente:

```bash
# 1. Conectarse al servidor
ssh ubuntu@tu-servidor

# 2. Ir al directorio del proyecto
cd /home/ubuntu/Verifireando

# 3. Obtener cambios del repositorio
git pull origin master

# 4. Backend - Instalar dependencias
cd backend
npm install

# 5. Backend - Reiniciar con PM2
pm2 restart verifireando-backend
pm2 save

# 6. Frontend - Instalar dependencias
cd ../frontend
npm install

# 7. Frontend - Corregir permisos y hacer build
sudo chown -R ubuntu:ubuntu dist 2>/dev/null || true
npm run build

# 8. Frontend - Ajustar permisos para Nginx
sudo chown -R www-data:www-data dist
sudo chmod -R 755 dist

# 9. Verificar y recargar Nginx
sudo nginx -t
sudo systemctl reload nginx

# 10. Verificar estado
pm2 status
pm2 logs verifireando-backend --lines 50
```

## ✅ Verificación Post-Deploy

### URLs para Probar:

1. **Login Cliente**: 
   - https://www.verificandoando.com.mx/auth/login
   - ✅ Debe tener botón "Continuar con Google"
   - ✅ NO debe tener enlace a login chofer

2. **Login Chofer**: 
   - https://www.verificandoando.com.mx/auth/login/driver
   - ✅ Debe tener botón "Continuar con Google"
   - ✅ Debe tener enlace a registro chofer

3. **Registro Cliente**: 
   - https://www.verificandoando.com.mx/auth/register
   - ✅ Solo campos básicos (sin licencia)
   - ✅ Botón Google crea como cliente

4. **Registro Chofer**: 
   - https://www.verificandoando.com.mx/auth/register/driver
   - ✅ Campos básicos + licencia
   - ✅ Botón Google crea como chofer

### Verificar Logs:

```bash
# Ver logs del backend
pm2 logs verifireando-backend --lines 100

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Verificar estado de PM2
pm2 status
pm2 monit
```

## 🔧 Solución de Problemas

### Si el build falla por permisos:
```bash
cd /home/ubuntu/Verifireando/frontend
sudo rm -rf dist
sudo chown -R ubuntu:ubuntu .
npm run build
sudo chown -R www-data:www-data dist
```

### Si Nginx da 403:
```bash
sudo chown -R www-data:www-data /home/ubuntu/Verifireando/frontend/dist
sudo chmod -R 755 /home/ubuntu/Verifireando/frontend/dist
sudo systemctl reload nginx
```

### Si PM2 no inicia:
```bash
pm2 delete verifireando-backend
pm2 start ecosystem.config.js --name verifireando-backend
pm2 save
```

## 📊 Monitoreo

```bash
# Ver uso de recursos
pm2 monit

# Ver logs en tiempo real
pm2 logs verifireando-backend

# Verificar que el backend responde
curl http://localhost:5000/api/health
```
