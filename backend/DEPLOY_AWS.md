# 🚀 COMANDOS PARA ACTUALIZAR CÓDIGO EN AWS EC2

## 📋 PASO 1: PREPARAR CÓDIGO LOCALMENTE

Desde tu computadora local (Windows):

```powershell
# Navegar al directorio del backend
cd e:\Verifireando\backend

# Asegurarte de que todo está guardado
git status

# Hacer commit de los cambios (si usas Git)
git add .
git commit -m "Correcciones de rutas y pruebas exitosas"
git push origin main
```

---

## 📋 PASO 2: CONECTAR AL SERVIDOR AWS EC2

### Opción A: Usando SSH con archivo .pem

```powershell
# Desde PowerShell en tu computadora
ssh -i "ruta\a\tu-llave.pem" ubuntu@tu-ip-ec2

# Ejemplo:
ssh -i "C:\Users\TuUsuario\Downloads\verifireando-key.pem" ubuntu@54.123.45.67
```

### Opción B: Usando AWS Console (más fácil)

1. Ve a: https://console.aws.amazon.com/ec2/
2. Clic en **"Instances"**
3. Selecciona tu instancia
4. Clic en **"Connect"**
5. Selecciona **"EC2 Instance Connect"**
6. Clic en **"Connect"** (se abrirá terminal en navegador)

---

## 📋 PASO 3: ACTUALIZAR CÓDIGO EN EL SERVIDOR

Una vez conectado al servidor EC2, ejecuta estos comandos:

### 3.1 Navegar al directorio del proyecto

```bash
# Buscar el proyecto si no sabes dónde está
find /home -name "package.json" -path "*/verifireando/*" 2>/dev/null

# Ubicaciones comunes:
cd /home/ubuntu/verifireando/backend
# o
cd /var/www/verifireando/backend
# o
cd ~/verifireando/backend
```

### 3.2 Hacer backup del código actual

```bash
# Crear backup con fecha
sudo cp -r /home/ubuntu/verifireando/backend /home/ubuntu/verifireando/backend-backup-$(date +%Y%m%d-%H%M%S)

# Verificar que se creó el backup
ls -la /home/ubuntu/verifireando/
```

### 3.3 Actualizar código desde Git (si usas repositorio)

```bash
# Detener la aplicación primero
pm2 stop verifireando

# Actualizar código
git pull origin main

# Instalar dependencias nuevas (si las hay)
npm install

# Reiniciar aplicación
pm2 restart verifireando
```

### 3.4 Actualizar código manualmente (si NO usas Git)

Si no tienes Git configurado, necesitas subir los archivos:

**Desde tu computadora local:**

```powershell
# Usar SCP para copiar archivos
scp -i "ruta\a\tu-llave.pem" -r e:\Verifireando\backend\* ubuntu@tu-ip-ec2:/home/ubuntu/verifireando/backend/

# Ejemplo:
scp -i "C:\Users\TuUsuario\Downloads\verifireando-key.pem" -r e:\Verifireando\backend\* ubuntu@54.123.45.67:/home/ubuntu/verifireando/backend/
```

**Luego en el servidor EC2:**

```bash
# Navegar al directorio
cd /home/ubuntu/verifireando/backend

# Instalar dependencias
npm install

# Reiniciar aplicación
pm2 restart verifireando
```

---

## 📋 PASO 4: VERIFICAR QUE FUNCIONA

### 4.1 Ver logs en tiempo real

```bash
# Ver logs de PM2
pm2 logs verifireando --lines 50

# Ver estado de la aplicación
pm2 status

# Ver logs del sistema
sudo journalctl -u verifireando -f
```

### 4.2 Probar endpoints localmente en el servidor

```bash
# Health check
curl http://localhost:5000/api/health

# Diagnostics
curl http://localhost:5000/api/diagnostics

# Servicios
curl http://localhost:5000/api/services
```

### 4.3 Probar desde tu navegador

Abre estas URLs:

1. **Health:** https://www.verificandoando.com.mx/api/health
2. **Diagnostics:** https://www.verificandoando.com.mx/api/diagnostics
3. **Servicios:** https://www.verificandoando.com.mx/api/services

---

## 📋 PASO 5: COMANDOS ÚTILES DE PM2

```bash
# Ver todas las aplicaciones
pm2 list

# Reiniciar aplicación
pm2 restart verifireando

# Detener aplicación
pm2 stop verifireando

# Iniciar aplicación
pm2 start verifireando

# Ver logs en tiempo real
pm2 logs verifireando --lines 100 --follow

# Ver información detallada
pm2 show verifireando

# Reiniciar con 0 downtime
pm2 reload verifireando

# Guardar configuración de PM2
pm2 save

# Ver uso de recursos
pm2 monit
```

---

## 🔧 COMANDOS COMPLETOS (COPIA Y PEGA)

### Script completo para actualizar desde Git:

```bash
#!/bin/bash
echo "🚀 Actualizando Verifireando Backend..."

# Navegar al directorio
cd /home/ubuntu/verifireando/backend

# Hacer backup
echo "📦 Creando backup..."
sudo cp -r /home/ubuntu/verifireando/backend /home/ubuntu/verifireando/backend-backup-$(date +%Y%m%d-%H%M%S)

# Detener aplicación
echo "⏸️  Deteniendo aplicación..."
pm2 stop verifireando

# Actualizar código
echo "📥 Descargando actualizaciones..."
git pull origin main

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Reiniciar aplicación
echo "▶️  Reiniciando aplicación..."
pm2 restart verifireando

# Ver logs
echo "📋 Logs recientes:"
pm2 logs verifireando --lines 20 --nostream

echo "✅ Actualización completada!"
```

### Script para actualizar sin Git (después de copiar archivos con SCP):

```bash
#!/bin/bash
echo "🚀 Actualizando Verifireando Backend..."

# Navegar al directorio
cd /home/ubuntu/verifireando/backend

# Hacer backup
echo "📦 Creando backup..."
sudo cp -r /home/ubuntu/verifireando/backend /home/ubuntu/verifireando/backend-backup-$(date +%Y%m%d-%H%M%S)

# Detener aplicación
echo "⏸️  Deteniendo aplicación..."
pm2 stop verifireando

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Reiniciar aplicación
echo "▶️  Reiniciando aplicación..."
pm2 restart verifireando

# Ver logs
echo "📋 Logs recientes:"
pm2 logs verifireando --lines 20 --nostream

echo "✅ Actualización completada!"
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Permission denied"

```bash
# Dar permisos al usuario actual
sudo chown -R $USER:$USER /home/ubuntu/verifireando

# Intentar de nuevo
pm2 restart verifireando
```

### Error: "Port 5000 already in use"

```bash
# Encontrar proceso usando el puerto
sudo lsof -i :5000

# Matar el proceso (reemplaza PID con el número que aparece)
kill -9 PID

# O matar todos los procesos de Node.js
pkill -f node

# Reiniciar
pm2 restart verifireando
```

### Error: "PM2 not found"

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar aplicación
cd /home/ubuntu/verifireando/backend
pm2 start server.js --name verifireando

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
# (Ejecuta el comando que te muestre)
```

### Error: "Cannot find module"

```bash
# Reinstalar todas las dependencias
cd /home/ubuntu/verifireando/backend
rm -rf node_modules
rm package-lock.json
npm install

# Reiniciar
pm2 restart verifireando
```

### Verificar que el servidor está corriendo

```bash
# Ver procesos de Node.js
ps aux | grep node

# Ver estado de PM2
pm2 status

# Probar conexión local
curl http://localhost:5000/api/health

# Ver logs completos
pm2 logs verifireando --lines 100
```

---

## 📊 CHECKLIST DE ACTUALIZACIÓN

- [ ] Código actualizado localmente
- [ ] Commit y push a Git (si aplica)
- [ ] Conectado a EC2 por SSH
- [ ] Backup del código actual creado
- [ ] Código actualizado en servidor (Git pull o SCP)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Aplicación reiniciada (`pm2 restart`)
- [ ] Logs verificados (sin errores)
- [ ] `/api/health` responde OK
- [ ] `/api/diagnostics` muestra conexión a DB
- [ ] Pruebas desde app móvil funcionan

---

## 🎯 RESUMEN RÁPIDO

**Si usas Git:**
```bash
ssh -i tu-llave.pem ubuntu@tu-ip-ec2
cd /home/ubuntu/verifireando/backend
pm2 stop verifireando
git pull origin main
npm install
pm2 restart verifireando
pm2 logs verifireando
```

**Si NO usas Git:**
```powershell
# Desde tu PC:
scp -i tu-llave.pem -r e:\Verifireando\backend\* ubuntu@tu-ip-ec2:/home/ubuntu/verifireando/backend/

# Luego en EC2:
ssh -i tu-llave.pem ubuntu@tu-ip-ec2
cd /home/ubuntu/verifireando/backend
pm2 stop verifireando
npm install
pm2 restart verifireando
pm2 logs verifireando
```

---

## 💡 RECOMENDACIÓN: CONFIGURAR GIT EN EC2

Para futuras actualizaciones más fáciles:

```bash
# En el servidor EC2
cd /home/ubuntu/verifireando/backend

# Inicializar Git si no está
git init

# Agregar tu repositorio remoto
git remote add origin https://github.com/tu-usuario/verifireando.git

# O si usas SSH
git remote add origin git@github.com:tu-usuario/verifireando.git

# Configurar Git
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Ahora puedes actualizar con:
git pull origin main
```

---

**Tiempo estimado de actualización: 5-10 minutos**
