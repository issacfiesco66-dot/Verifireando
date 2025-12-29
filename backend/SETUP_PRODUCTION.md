# 🚀 CONFIGURACIÓN DE PRODUCCIÓN - verificandoando.com.mx

## 📋 PASO A PASO PARA CONECTAR TU SERVIDOR A LA BASE DE DATOS

### **PASO 1: Configurar MongoDB Atlas**

#### 1.1 Acceder a MongoDB Atlas
1. Ve a: https://cloud.mongodb.com
2. Inicia sesión con tu cuenta
3. Selecciona tu cluster (o crea uno nuevo si no tienes)

#### 1.2 Configurar IP Whitelist
1. En el menú lateral, haz clic en **"Network Access"**
2. Haz clic en **"Add IP Address"**
3. Selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Haz clic en **"Confirm"**

**⚠️ IMPORTANTE:** Sin este paso, tu servidor no podrá conectarse.

#### 1.3 Crear Usuario de Base de Datos
1. En el menú lateral, haz clic en **"Database Access"**
2. Haz clic en **"Add New Database User"**
3. Configura:
   - Username: `verifireando`
   - Password: `verifireando123` (o uno más seguro)
   - Database User Privileges: **"Read and write to any database"**
4. Haz clic en **"Add User"**

#### 1.4 Obtener Connection String
1. Ve a **"Database"** en el menú lateral
2. Haz clic en **"Connect"** en tu cluster
3. Selecciona **"Connect your application"**
4. Copia el connection string, se verá así:
   ```
   mongodb+srv://verifireando:<password>@cluster0.xxxxx.mongodb.net/verifireando?retryWrites=true&w=majority
   ```
5. Reemplaza `<password>` con tu contraseña real

---

### **PASO 2: Migrar Datos a Atlas**

#### Opción A: Usando el script automático (Recomendado)

```bash
# En tu computadora local
cd backend
node migrate-to-atlas.js
```

Este script:
- ✅ Conecta a tu MongoDB local
- ✅ Conecta a MongoDB Atlas
- ✅ Copia todos los datos automáticamente
- ✅ Verifica que todo se copió correctamente

#### Opción B: Manual con mongodump/mongorestore

```bash
# 1. Exportar datos locales
mongodump --uri="mongodb://localhost:27017/verifireando" --out=./backup

# 2. Importar a Atlas
mongorestore --uri="mongodb+srv://verifireando:PASSWORD@cluster0.xxxxx.mongodb.net/verifireando" ./backup/verifireando
```

---

### **PASO 3: Actualizar Variables de Entorno en tu Servidor**

Dependiendo de dónde esté alojado tu servidor:

#### Si usas **Railway**:
1. Ve a tu proyecto en Railway
2. Haz clic en tu servicio
3. Ve a la pestaña **"Variables"**
4. Agrega/actualiza:
   ```
   MONGODB_URI=mongodb+srv://verifireando:verifireando123@cluster0.xxxxx.mongodb.net/verifireando?retryWrites=true&w=majority
   NODE_ENV=production
   ```
5. El servidor se reiniciará automáticamente

#### Si usas **Render**:
1. Ve a tu dashboard en Render
2. Selecciona tu servicio
3. Ve a **"Environment"**
4. Agrega/actualiza las variables
5. Haz clic en **"Save Changes"**

#### Si usas **VPS/DigitalOcean**:
1. Conéctate por SSH a tu servidor
2. Edita el archivo .env:
   ```bash
   cd /ruta/a/tu/proyecto/backend
   nano .env
   ```
3. Actualiza la línea:
   ```
   MONGODB_URI=mongodb+srv://verifireando:verifireando123@cluster0.xxxxx.mongodb.net/verifireando?retryWrites=true&w=majority
   ```
4. Guarda (Ctrl+O, Enter, Ctrl+X)
5. Reinicia el servidor:
   ```bash
   pm2 restart verifireando
   # o
   systemctl restart verifireando
   ```

#### Si usas **cPanel/Hosting compartido**:
1. Ve al administrador de archivos
2. Navega a la carpeta de tu proyecto
3. Edita el archivo `.env`
4. Actualiza `MONGODB_URI`
5. Reinicia la aplicación Node.js desde el panel

---

### **PASO 4: Verificar la Conexión**

#### 4.1 Verificar en el navegador
Ve a: https://www.verificandoando.com.mx/api/diagnostics

Deberías ver algo como:
```json
{
  "status": "ok",
  "timestamp": "2025-12-28T...",
  "environment": "production",
  "database": {
    "connected": true,
    "host": "cluster0.xxxxx.mongodb.net"
  }
}
```

#### 4.2 Verificar health check
Ve a: https://www.verificandoando.com.mx/health

Deberías ver:
```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2025-12-28T..."
}
```

#### 4.3 Verificar servicios
Ve a: https://www.verificandoando.com.mx/api/services

Deberías ver los 5 servicios que creamos.

---

### **PASO 5: Probar desde tu App Móvil**

1. **Registro de Cliente:**
   - Abre tu app
   - Registra un nuevo usuario
   - El código OTP aparecerá en los logs del servidor

2. **Ver logs del servidor:**
   
   **Railway:**
   ```bash
   railway logs
   ```
   
   **Render:**
   - Ve a tu servicio → Pestaña "Logs"
   
   **VPS:**
   ```bash
   pm2 logs verifireando
   # o
   tail -f /var/log/verifireando.log
   ```

3. **Buscar el código OTP en los logs:**
   ```
   Mock WhatsApp OTP enviado a +525512345678: 123456
   ```

4. **Verificar con el código:**
   - Ingresa el código en tu app
   - Deberías poder hacer login

---

## 🔧 VARIABLES DE ENTORNO COMPLETAS PARA PRODUCCIÓN

Crea/actualiza tu archivo `.env` en el servidor con:

```env
# Base de Datos
MONGODB_URI=mongodb+srv://verifireando:verifireando123@cluster0.xxxxx.mongodb.net/verifireando?retryWrites=true&w=majority

# Entorno
NODE_ENV=production
PORT=5000

# Seguridad
JWT_SECRET=tu_secreto_jwt_muy_seguro_de_64_caracteres_minimo_aqui
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh_tokens_64_caracteres

# Frontend
FRONTEND_URL=https://www.verificandoando.com.mx
ALLOWED_ORIGINS=https://www.verificandoando.com.mx,https://verificandoando.com.mx

# WhatsApp (Temporal - Mock)
# Cuando configures WhatsApp Business API, agrega:
# WHATSAPP_API_KEY=tu_api_key
# WHATSAPP_PHONE_NUMBER_ID=tu_phone_id

# Stripe (Cuando lo configures)
# STRIPE_SECRET_KEY=sk_live_tu_clave_secreta
# STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_publica
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "MongoNetworkError: connection timed out"
**Solución:**
- Verifica que agregaste 0.0.0.0/0 en IP Whitelist de Atlas
- Espera 2-3 minutos después de agregar la IP

### Problema: "Authentication failed"
**Solución:**
- Verifica usuario y contraseña en Atlas
- Asegúrate de reemplazar `<password>` en el connection string
- Verifica que el usuario tenga permisos de lectura/escritura

### Problema: "No veo los datos en Atlas"
**Solución:**
- Ejecuta el script de migración: `node migrate-to-atlas.js`
- Verifica en Atlas → Collections que los datos estén ahí

### Problema: "El servidor no se reinicia"
**Solución:**
- Railway/Render: Se reinicia automáticamente al cambiar variables
- VPS: Ejecuta `pm2 restart verifireando`
- Verifica logs para ver errores

---

## ✅ CHECKLIST FINAL

- [ ] MongoDB Atlas configurado con IP whitelist 0.0.0.0/0
- [ ] Usuario de base de datos creado
- [ ] Connection string obtenido
- [ ] Datos migrados a Atlas
- [ ] Variable MONGODB_URI actualizada en el servidor
- [ ] Servidor reiniciado
- [ ] `/api/diagnostics` muestra conexión exitosa
- [ ] `/api/services` muestra los 5 servicios
- [ ] Registro desde app móvil funciona
- [ ] Código OTP visible en logs del servidor

---

## 📞 COMANDOS ÚTILES

### Ver logs en tiempo real:
```bash
# Railway
railway logs --follow

# Render
# Ir a Dashboard → Service → Logs

# VPS con PM2
pm2 logs verifireando --lines 100

# VPS con systemd
journalctl -u verifireando -f
```

### Reiniciar servidor:
```bash
# Railway
railway up

# Render
# Deploy automático al hacer push

# VPS con PM2
pm2 restart verifireando

# VPS con systemd
systemctl restart verifireando
```

### Verificar estado:
```bash
# PM2
pm2 status

# systemd
systemctl status verifireando
```

---

## 🎯 RESULTADO ESPERADO

Después de completar estos pasos:

1. ✅ Tu servidor en https://www.verificandoando.com.mx estará conectado a MongoDB Atlas
2. ✅ Podrás registrar usuarios desde tu app móvil
3. ✅ Los códigos OTP aparecerán en los logs del servidor
4. ✅ Los usuarios podrán hacer login y crear citas
5. ✅ Todos los datos se guardarán en Atlas (con backups automáticos)

---

## 📊 MONITOREO

### MongoDB Atlas:
- Ve a tu cluster → Metrics para ver:
  - Conexiones activas
  - Operaciones por segundo
  - Uso de almacenamiento

### Logs del servidor:
- Monitorea errores de conexión
- Verifica que los códigos OTP se generen
- Revisa tiempos de respuesta

---

¿Necesitas ayuda con algún paso específico? Puedo guiarte en tiempo real.
