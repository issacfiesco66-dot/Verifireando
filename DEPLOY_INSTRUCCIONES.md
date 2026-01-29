# Instrucciones de Deploy - Correcciones Chofer

## 📋 Cambios Realizados

1. ✅ Agregado Google Sign-In al DriverLogin
2. ✅ Corregidos links inconsistentes en Login.jsx
3. ✅ Agregado RedirectWithQuery para preservar query params
4. ✅ Modificado backend para aceptar rol en Google sign-in
5. ✅ Unificado registro con soporte para query param `role=driver`

## 🚀 Deploy en el Servidor

### Opción 1: Usar el script automático

```bash
cd /home/ubuntu/Verifireando
git pull origin master
bash deploy-fix-chofer.sh
```

### Opción 2: Comandos manuales

```bash
cd /home/ubuntu/Verifireando
git pull origin master

# Backend
cd backend
npm install
pm2 restart verifireando-backend

# Frontend
cd ../frontend
npm install
sudo chown -R ubuntu:ubuntu dist
npm run build
sudo systemctl reload nginx
```

## ✅ Verificación Post-Deploy

1. **Login Chofer**: https://www.verificandoando.com.mx/auth/login/driver
   - Debe mostrar botón "Continuar con Google"
   - Link a registro debe funcionar

2. **Registro Chofer**: https://www.verificandoando.com.mx/auth/register?role=driver
   - Debe pre-seleccionar "Chofer"
   - Debe mostrar campos de licencia
   - Botón de Google debe funcionar

3. **Redirect**: https://www.verificandoando.com.mx/register?role=driver
   - Debe redirigir a `/auth/register?role=driver` preservando el query param

## 🐛 Si hay problemas

1. Verificar logs del backend:
   ```bash
   pm2 logs verifireando-backend --lines 50
   ```

2. Verificar estado de Nginx:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. Verificar permisos:
   ```bash
   ls -la /home/ubuntu/Verifireando/frontend/dist
   ```
