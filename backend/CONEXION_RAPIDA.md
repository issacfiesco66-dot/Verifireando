# ⚡ CONEXIÓN RÁPIDA - verificandoando.com.mx

## 🎯 OBJETIVO
Conectar tu servidor en https://www.verificandoando.com.mx a MongoDB Atlas para que funcione con los datos correctos.

---

## 📋 OPCIÓN 1: USAR ATLAS QUE YA TIENES

### Paso 1: Obtener tu URI de Atlas
1. Ve a: https://cloud.mongodb.com
2. Inicia sesión
3. Haz clic en **"Connect"** en tu cluster
4. Selecciona **"Connect your application"**
5. Copia la URI (se ve así):
   ```
   mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/verifireando
   ```

### Paso 2: Configurar IP Whitelist
1. En Atlas, ve a **"Network Access"**
2. Haz clic en **"Add IP Address"**
3. Selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Confirma

### Paso 3: Migrar datos a Atlas
En tu computadora local, ejecuta:
```bash
cd backend

# Primero, prueba la conexión
node setup-atlas-connection.js
# (Te pedirá tu URI de Atlas)

# Si la conexión es exitosa, migra los datos
node migrate-to-atlas.js
```

### Paso 4: Actualizar servidor de producción

**¿Dónde está alojado tu servidor?**

#### A) Si usas **Railway**:
```bash
# Desde tu computadora
railway login
railway link
railway variables set MONGODB_URI="tu-uri-de-atlas-aqui"
```

#### B) Si usas **Render**:
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio
3. Ve a **"Environment"**
4. Actualiza `MONGODB_URI` con tu URI de Atlas
5. Guarda

#### C) Si usas **VPS/DigitalOcean**:
```bash
# Conéctate por SSH
ssh usuario@tu-servidor

# Edita el .env
cd /ruta/a/tu/proyecto/backend
nano .env

# Actualiza esta línea:
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/verifireando

# Guarda (Ctrl+O, Enter, Ctrl+X)

# Reinicia
pm2 restart verifireando
```

#### D) Si usas **cPanel**:
1. Ve al File Manager
2. Navega a tu proyecto/backend
3. Edita `.env`
4. Actualiza `MONGODB_URI`
5. Reinicia la app desde Node.js Selector

---

## 📋 OPCIÓN 2: CREAR NUEVO CLUSTER EN ATLAS (Recomendado si no tienes)

### Paso 1: Crear cuenta/cluster
1. Ve a: https://cloud.mongodb.com
2. Crea cuenta gratuita
3. Crea un cluster gratuito (M0)
4. Región: Elige la más cercana a tu servidor
5. Nombre: `verifireando`

### Paso 2: Configurar acceso
1. **Database Access:**
   - Username: `verifireando`
   - Password: `verifireando123` (o uno más seguro)
   - Privileges: "Read and write to any database"

2. **Network Access:**
   - Add IP: `0.0.0.0/0` (Allow from anywhere)

### Paso 3: Obtener URI
1. Haz clic en **"Connect"**
2. Selecciona **"Connect your application"**
3. Copia la URI
4. Reemplaza `<password>` con tu contraseña

### Paso 4: Migrar y configurar
Sigue los pasos de la Opción 1, Pasos 3 y 4.

---

## ✅ VERIFICACIÓN

Después de actualizar, verifica que funcione:

### 1. Health Check
```bash
curl https://www.verificandoando.com.mx/health
```
Debe responder: `{"status":"ok",...}`

### 2. Diagnostics
```bash
curl https://www.verificandoando.com.mx/api/diagnostics
```
Debe mostrar: `"database": { "connected": true }`

### 3. Servicios
```bash
curl https://www.verificandoando.com.mx/api/services
```
Debe mostrar los 5 servicios

### 4. Desde tu app móvil
- Intenta registrar un usuario
- Revisa los logs del servidor para ver el código OTP

---

## 🐛 PROBLEMAS COMUNES

### "Connection timeout"
- Verifica IP whitelist en Atlas (0.0.0.0/0)
- Espera 2-3 minutos después de agregar IP

### "Authentication failed"
- Verifica usuario y password en Atlas
- Asegúrate de reemplazar `<password>` en la URI

### "No veo los datos"
- Ejecuta `node migrate-to-atlas.js` para copiar datos
- Verifica en Atlas → Collections

### "El servidor no se reinicia"
- Railway/Render: Automático al cambiar variables
- VPS: `pm2 restart verifireando`

---

## 📞 COMANDOS ÚTILES

### Ver logs del servidor:
```bash
# Railway
railway logs

# VPS
pm2 logs verifireando --lines 100
```

### Verificar conexión local a Atlas:
```bash
node setup-atlas-connection.js
```

### Migrar datos:
```bash
node migrate-to-atlas.js
```

---

## 🎯 RESUMEN RÁPIDO

1. ✅ Obtén tu URI de MongoDB Atlas
2. ✅ Configura IP whitelist (0.0.0.0/0)
3. ✅ Migra datos: `node migrate-to-atlas.js`
4. ✅ Actualiza `MONGODB_URI` en tu servidor
5. ✅ Reinicia el servidor
6. ✅ Verifica: `/api/diagnostics`

**Tiempo estimado: 10-15 minutos**

---

## 💡 ¿NECESITAS AYUDA?

Dime:
1. ¿Dónde está alojado tu servidor? (Railway/Render/VPS/cPanel)
2. ¿Ya tienes MongoDB Atlas configurado?
3. ¿Cuál es el error que ves?

Y te guío paso a paso.
