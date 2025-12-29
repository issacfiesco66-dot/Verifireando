# 🚀 CONFIGURACIÓN AWS EC2 - verificandoando.com.mx

## 📋 GUÍA PASO A PASO PARA CONECTAR EC2 A MONGODB ATLAS

---

## PASO 1: Obtener URI de MongoDB Atlas

### 1.1 Acceder a MongoDB Atlas
1. Ve a: https://cloud.mongodb.com
2. Inicia sesión
3. Selecciona tu cluster

### 1.2 Configurar Network Access (CRÍTICO)
1. En el menú lateral, haz clic en **"Network Access"**
2. Haz clic en **"Add IP Address"**
3. Selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Haz clic en **"Confirm"**
5. **Espera 2-3 minutos** para que se aplique

### 1.3 Obtener Connection String
1. Haz clic en **"Connect"** en tu cluster
2. Selecciona **"Connect your application"**
3. Copia la URI completa:
   ```
   mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/verifireando?retryWrites=true&w=majority
   ```
4. **IMPORTANTE:** Reemplaza `<password>` con tu contraseña real

---

## PASO 2: Migrar Datos a Atlas (Desde tu PC local)

En tu computadora local, ejecuta:

```bash
cd backend

# Probar conexión a Atlas
node setup-atlas-connection.js
# (Te pedirá tu URI de Atlas - pégala cuando te lo pida)

# Si la conexión es exitosa, migrar datos
node migrate-to-atlas.js
```

Esto copiará:
- ✅ 1 usuario admin
- ✅ 5 servicios
- ✅ 2 cupones
- ✅ Todas las colecciones con índices

---

## PASO 3: Conectarse al Servidor EC2

### Opción A: Usando SSH con archivo .pem

```bash
# Desde tu computadora local
ssh -i /ruta/a/tu-llave.pem ubuntu@tu-ip-publica-ec2

# Ejemplo:
ssh -i ~/Downloads/verifireando-key.pem ubuntu@54.123.45.67
```

### Opción B: Usando SSH con usuario/password

```bash
ssh usuario@tu-ip-publica-ec2
# Ingresa tu contraseña cuando te lo pida
```

### Opción C: Desde AWS Console

1. Ve a AWS Console → EC2 → Instances
2. Selecciona tu instancia
3. Haz clic en **"Connect"**
4. Usa **"EC2 Instance Connect"** (navegador)

---

## PASO 4: Localizar tu Aplicación en EC2

Una vez conectado por SSH, encuentra dónde está tu proyecto:

```bash
# Buscar el proyecto
find / -name "app.js" -type f 2>/dev/null | grep verifireando

# O buscar por package.json
find / -name "package.json" -type f 2>/dev/null | grep verifireando

# Ubicaciones comunes:
ls /home/ubuntu/verifireando
ls /var/www/verifireando
ls /opt/verifireando
ls ~/verifireando
```

Anota la ruta completa, ejemplo: `/home/ubuntu/verifireando/backend`

---

## PASO 5: Actualizar Variables de Entorno

### 5.1 Navegar al directorio del backend

```bash
cd /ruta/a/tu/proyecto/backend
# Ejemplo:
cd /home/ubuntu/verifireando/backend
```

### 5.2 Hacer backup del .env actual

```bash
cp .env .env.backup
```

### 5.3 Editar el archivo .env

```bash
nano .env
```

### 5.4 Actualizar/Agregar estas líneas:

```env
# Base de Datos - REEMPLAZA CON TU URI REAL
MONGODB_URI=mongodb+srv://verifireando:TU_PASSWORD@cluster0.xxxxx.mongodb.net/verifireando?retryWrites=true&w=majority

# Entorno
NODE_ENV=production

# Seguridad (genera secretos seguros)
JWT_SECRET=tu_secreto_jwt_muy_seguro_de_64_caracteres_minimo
JWT_REFRESH_SECRET=otro_secreto_diferente_64_caracteres

# Frontend
FRONTEND_URL=https://www.verificandoando.com.mx
ALLOWED_ORIGINS=https://www.verificandoando.com.mx,https://verificandoando.com.mx

# Puerto
PORT=5000
```

### 5.5 Guardar y salir

- Presiona `Ctrl + O` (guardar)
- Presiona `Enter` (confirmar)
- Presiona `Ctrl + X` (salir)

---

## PASO 6: Reiniciar la Aplicación

### Opción A: Si usas PM2 (Recomendado)

```bash
# Ver procesos actuales
pm2 list

# Reiniciar la aplicación
pm2 restart verifireando
# o
pm2 restart all

# Ver logs en tiempo real
pm2 logs verifireando --lines 100
```

### Opción B: Si usas systemd

```bash
# Reiniciar servicio
sudo systemctl restart verifireando

# Ver estado
sudo systemctl status verifireando

# Ver logs
sudo journalctl -u verifireando -f
```

### Opción C: Si usas screen/tmux

```bash
# Listar sesiones de screen
screen -ls

# Conectar a la sesión
screen -r verifireando

# Detener la app (Ctrl+C)
# Iniciar de nuevo
npm start

# Desconectar sin cerrar (Ctrl+A, luego D)
```

### Opción D: Si no usas ningún process manager

```bash
# Encontrar el proceso Node.js
ps aux | grep node

# Matar el proceso (reemplaza PID con el número real)
kill -9 PID

# Iniciar de nuevo
cd /ruta/a/tu/proyecto/backend
nohup npm start > output.log 2>&1 &
```

---

## PASO 7: Verificar que Funciona

### 7.1 Verificar logs

```bash
# Si usas PM2
pm2 logs verifireando --lines 50

# Si usas systemd
sudo journalctl -u verifireando -n 50

# Si usas nohup
tail -f /ruta/a/tu/proyecto/backend/output.log
```

**Busca en los logs:**
- ✅ `MongoDB Connected: cluster0.xxxxx.mongodb.net`
- ✅ `Servidor corriendo en puerto 5000`
- ❌ Errores de conexión a MongoDB

### 7.2 Probar desde el navegador

Abre estas URLs:

1. **Health Check:**
   ```
   https://www.verificandoando.com.mx/health
   ```
   Debe responder: `{"status":"ok",...}`

2. **Diagnostics:**
   ```
   https://www.verificandoando.com.mx/api/diagnostics
   ```
   Debe mostrar:
   ```json
   {
     "status": "ok",
     "database": {
       "connected": true,
       "host": "cluster0.xxxxx.mongodb.net"
     }
   }
   ```

3. **Servicios:**
   ```
   https://www.verificandoando.com.mx/api/services
   ```
   Debe mostrar los 5 servicios

### 7.3 Probar desde tu app móvil

1. Abre tu app
2. Intenta registrar un nuevo usuario
3. Revisa los logs del servidor para ver el código OTP:
   ```bash
   pm2 logs verifireando | grep "OTP"
   ```

---

## 🔧 COMANDOS ÚTILES PARA EC2

### Ver logs en tiempo real:
```bash
# PM2
pm2 logs verifireando --lines 100 --follow

# systemd
sudo journalctl -u verifireando -f

# archivo de log
tail -f /ruta/a/output.log
```

### Reiniciar aplicación:
```bash
# PM2
pm2 restart verifireando

# systemd
sudo systemctl restart verifireando

# Manual
pkill -f "node.*app.js" && cd /ruta && npm start &
```

### Ver estado:
```bash
# PM2
pm2 status

# systemd
sudo systemctl status verifireando

# Procesos Node.js
ps aux | grep node
```

### Ver uso de recursos:
```bash
# CPU y memoria
top
# (presiona 'q' para salir)

# Espacio en disco
df -h

# Memoria
free -h
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "MongoNetworkError: connection timed out"

**Causa:** IP no está en whitelist de Atlas

**Solución:**
1. Ve a MongoDB Atlas → Network Access
2. Agrega `0.0.0.0/0` (Allow from anywhere)
3. Espera 2-3 minutos
4. Reinicia la app en EC2

### Problema: "Authentication failed"

**Causa:** Usuario/password incorrectos

**Solución:**
1. Verifica en Atlas → Database Access que el usuario existe
2. Verifica que reemplazaste `<password>` en la URI
3. Asegúrate de no tener espacios extra en el .env
4. Reinicia la app

### Problema: "Cannot find module"

**Causa:** Dependencias no instaladas

**Solución:**
```bash
cd /ruta/a/tu/proyecto/backend
npm install
pm2 restart verifireando
```

### Problema: "Port 5000 already in use"

**Causa:** Otra instancia corriendo

**Solución:**
```bash
# Encontrar el proceso
sudo lsof -i :5000

# Matar el proceso (reemplaza PID)
kill -9 PID

# O matar todos los procesos Node.js
pkill -f node

# Iniciar de nuevo
pm2 start app.js --name verifireando
```

### Problema: "Permission denied"

**Causa:** Permisos insuficientes

**Solución:**
```bash
# Dar permisos al directorio
sudo chown -R $USER:$USER /ruta/a/tu/proyecto

# O ejecutar con sudo (no recomendado)
sudo pm2 restart verifireando
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

- [ ] MongoDB Atlas configurado con IP whitelist 0.0.0.0/0
- [ ] Datos migrados a Atlas desde local
- [ ] Conectado a EC2 por SSH
- [ ] Archivo .env actualizado con MONGODB_URI correcto
- [ ] Aplicación reiniciada en EC2
- [ ] `/health` responde correctamente
- [ ] `/api/diagnostics` muestra conexión a Atlas
- [ ] `/api/services` muestra los 5 servicios
- [ ] Logs no muestran errores de conexión
- [ ] Registro desde app móvil funciona
- [ ] Código OTP visible en logs

---

## 🎯 SCRIPT DE VERIFICACIÓN RÁPIDA

Copia y pega esto en tu terminal EC2 para verificar todo:

```bash
#!/bin/bash
echo "🔍 VERIFICACIÓN DE CONFIGURACIÓN"
echo "================================"
echo ""

# Verificar que Node.js está corriendo
echo "1. Procesos Node.js:"
ps aux | grep node | grep -v grep
echo ""

# Verificar archivo .env
echo "2. Variables de entorno (MONGODB_URI):"
cd /home/ubuntu/verifireando/backend
grep MONGODB_URI .env | head -1
echo ""

# Verificar logs recientes
echo "3. Últimas líneas de log:"
pm2 logs verifireando --lines 10 --nostream
echo ""

# Probar health check local
echo "4. Health check local:"
curl -s http://localhost:5000/health | jq '.'
echo ""

# Probar diagnostics local
echo "5. Diagnostics local:"
curl -s http://localhost:5000/api/diagnostics | jq '.database'
echo ""

echo "✅ Verificación completada"
```

---

## 📞 RESUMEN EJECUTIVO

**Para conectar tu EC2 a MongoDB Atlas:**

1. ✅ Obtén URI de Atlas
2. ✅ Configura IP whitelist (0.0.0.0/0)
3. ✅ Migra datos: `node migrate-to-atlas.js`
4. ✅ SSH a EC2: `ssh -i key.pem ubuntu@ip`
5. ✅ Edita .env: `nano .env`
6. ✅ Actualiza `MONGODB_URI`
7. ✅ Reinicia: `pm2 restart verifireando`
8. ✅ Verifica: `/api/diagnostics`

**Tiempo estimado: 10-15 minutos**

---

¿Necesitas ayuda con algún paso específico?
