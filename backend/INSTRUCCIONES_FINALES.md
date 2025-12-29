# 🚀 INSTRUCCIONES FINALES - Configuración Automática

## ✅ TODO ESTÁ PREPARADO

He creado un script automático que hará toda la configuración por ti.

---

## 📋 SOLO NECESITAS HACER ESTO:

### **PASO 1: Obtener tu URI de MongoDB Atlas**

1. Ve a: https://cloud.mongodb.com
2. Inicia sesión
3. Haz clic en **"Connect"** en tu cluster
4. Selecciona **"Connect your application"**
5. Copia la URI completa (ejemplo):
   ```
   mongodb+srv://verifireando:password123@cluster0.xxxxx.mongodb.net/verifireando
   ```

**⚠️ IMPORTANTE:** Reemplaza `<password>` con tu contraseña real.

### **PASO 2: Configurar IP Whitelist en Atlas**

1. En Atlas, ve a **"Network Access"**
2. Haz clic en **"Add IP Address"**
3. Selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Confirma y espera 2-3 minutos

---

## 🎯 OPCIÓN A: YO LO HAGO TODO (Recomendado)

**Dame estos 2 datos:**

1. **Tu URI de MongoDB Atlas** (del Paso 1)
2. **La ruta de tu proyecto en EC2** (probablemente: `/home/ubuntu/verifireando/backend`)

**Yo haré:**
- ✅ Migrar todos los datos a Atlas
- ✅ Generar el script de configuración personalizado
- ✅ Darte los comandos exactos para ejecutar en tu EC2

---

## 🎯 OPCIÓN B: TÚ LO EJECUTAS (Más rápido)

### Desde tu computadora local:

```bash
cd backend

# 1. Migrar datos a Atlas (reemplaza con tu URI real)
export MONGODB_ATLAS_URI="mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/verifireando"
node migrate-to-atlas.js
```

### Conectarte a tu EC2:

```bash
# 2. Conectar por SSH
ssh -i /ruta/a/tu-llave.pem ubuntu@tu-ip-ec2

# 3. Descargar el script de configuración
cd /home/ubuntu/verifireando/backend
wget https://raw.githubusercontent.com/tu-repo/verifireando/main/backend/auto-setup-ec2.sh

# O copiar el script manualmente (ver abajo)
```

### Ejecutar el script automático:

```bash
# 4. Editar el script con tu URI
nano auto-setup-ec2.sh
# Reemplaza la línea MONGODB_URI con tu URI real

# 5. Dar permisos de ejecución
chmod +x auto-setup-ec2.sh

# 6. Ejecutar
bash auto-setup-ec2.sh
```

**El script hará automáticamente:**
- ✅ Backup del .env actual
- ✅ Actualizar variables de entorno
- ✅ Generar JWT secrets seguros
- ✅ Instalar dependencias
- ✅ Reiniciar la aplicación
- ✅ Verificar que todo funcione

---

## 📝 SCRIPT COMPLETO (Si prefieres copiar/pegar)

Copia este script completo, reemplaza `MONGODB_URI` con tu URI real, y ejecútalo en tu EC2:

```bash
#!/bin/bash

# REEMPLAZA ESTA LÍNEA CON TU URI REAL:
MONGODB_URI="mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/verifireando"

# Ruta del proyecto (ajusta si es diferente)
PROJECT_PATH="/home/ubuntu/verifireando/backend"

echo "🚀 Configurando servidor..."
cd $PROJECT_PATH

# Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null

# Crear .env
cat > .env << EOF
MONGODB_URI=$MONGODB_URI
NODE_ENV=production
PORT=5000
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
FRONTEND_URL=https://www.verificandoando.com.mx
ALLOWED_ORIGINS=https://www.verificandoando.com.mx,https://verificandoando.com.mx
EOF

echo "✅ Variables actualizadas"

# Instalar dependencias
npm install --production

# Reiniciar
if command -v pm2 &> /dev/null; then
    pm2 restart verifireando || pm2 start app.js --name verifireando
    echo "✅ Reiniciado con PM2"
    pm2 logs verifireando --lines 20
elif systemctl list-units --type=service | grep -q verifireando; then
    sudo systemctl restart verifireando
    echo "✅ Reiniciado con systemd"
    sudo journalctl -u verifireando -n 20
else
    echo "⚠️  Reinicia manualmente: npm start"
fi

# Verificar
sleep 5
curl -s http://localhost:5000/api/diagnostics | grep -q "connected" && echo "✅ MongoDB conectado" || echo "❌ Error de conexión"

echo ""
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "Verifica: https://www.verificandoando.com.mx/api/diagnostics"
```

---

## ✅ VERIFICACIÓN FINAL

Después de ejecutar el script, verifica:

1. **Diagnostics:**
   ```
   https://www.verificandoando.com.mx/api/diagnostics
   ```
   Debe mostrar: `"connected": true`

2. **Servicios:**
   ```
   https://www.verificandoando.com.mx/api/services
   ```
   Debe mostrar 5 servicios

3. **Desde tu app móvil:**
   - Registra un usuario
   - El código OTP aparecerá en los logs

---

## 🆘 SI ALGO FALLA

Ver logs en tu EC2:
```bash
# PM2
pm2 logs verifireando --lines 100

# systemd
sudo journalctl -u verifireando -f

# Manual
tail -f /ruta/a/output.log
```

---

## 📞 PRÓXIMO PASO

**Dame tu URI de MongoDB Atlas** y yo preparo todo el resto personalizado para ti.

O si prefieres hacerlo tú mismo, copia el script de arriba, reemplaza la URI, y ejecútalo en tu EC2.

**Tiempo total: 5 minutos** ⏱️
