# Solución para Error 403 Forbidden

## 🔍 Diagnóstico

El error 403 Forbidden en Nginx generalmente se debe a:

1. **Permisos incorrectos** en el directorio `dist`
2. **Directorio no existe** o `index.html` no está presente
3. **Configuración de Nginx** apunta a ruta incorrecta
4. **Usuario de Nginx** no tiene permisos de lectura

## 🚀 Solución Rápida

Ejecuta estos comandos en el servidor:

```bash
cd /home/ubuntu/Verifireando

# 1. Verificar que el build existe
ls -la frontend/dist/index.html

# 2. Corregir permisos
sudo chown -R www-data:www-data frontend/dist
sudo chmod -R 755 frontend/dist

# 3. Verificar configuración de Nginx
sudo nginx -t

# 4. Recargar Nginx
sudo systemctl reload nginx

# 5. Verificar logs si persiste el error
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Script Automático

O usa el script que creé:

```bash
cd /home/ubuntu/Verifireando
bash fix-nginx-403.sh
```

## 📋 Verificación Post-Fix

1. Accede a: https://www.verificandoando.com.mx
2. Debe cargar la página principal (no 403)
3. Verifica que los assets cargan correctamente

## 🐛 Si el problema persiste

1. **Verificar qué configuración está activa**:
   ```bash
   sudo nginx -T | grep -A 10 "server_name.*verificandoando"
   ```

2. **Verificar permisos del usuario de Nginx**:
   ```bash
   ps aux | grep nginx
   # El usuario suele ser www-data o nginx
   ```

3. **Verificar SELinux** (si está activo):
   ```bash
   getenforce
   # Si está "Enforcing", puede necesitar ajustes
   ```

4. **Revisar logs detallados**:
   ```bash
   sudo tail -50 /var/log/nginx/error.log
   ```
