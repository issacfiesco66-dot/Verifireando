# Configurar Google Sign-In en Firebase

## 🔴 Problema Actual

El error **"Google login solo está disponible con Firebase Auth"** aparece porque el método de autenticación de Google no está habilitado en la consola de Firebase.

---

## ✅ Solución: Habilitar Google Sign-In en Firebase Console

### **Paso 1: Acceder a Firebase Console**

1. Ve a: https://console.firebase.google.com/
2. Inicia sesión con tu cuenta de Google
3. Selecciona el proyecto: **verificandoando-40ad5**

### **Paso 2: Habilitar Google Sign-In**

1. En el menú lateral, haz clic en **"Authentication"** (Autenticación)
2. Haz clic en la pestaña **"Sign-in method"** (Método de inicio de sesión)
3. Busca **"Google"** en la lista de proveedores
4. Haz clic en **"Google"**
5. Activa el interruptor **"Enable"** (Habilitar)
6. Configura los siguientes campos:

   **Campos Requeridos:**
   - ✅ **Project support email**: Selecciona tu email (el que usas para Firebase)
   - ✅ **Project public-facing name**: `Verifireando` (o el nombre que prefieras)

7. Haz clic en **"Save"** (Guardar)

### **Paso 3: Configurar Dominios Autorizados**

1. En la misma página de **"Sign-in method"**
2. Desplázate hasta **"Authorized domains"** (Dominios autorizados)
3. Verifica que estos dominios estén en la lista:
   - ✅ `localhost` (para desarrollo)
   - ✅ `verificandoando.com.mx` (tu dominio de producción)
   - ✅ `www.verificandoando.com.mx` (con www)

4. Si falta alguno, haz clic en **"Add domain"** (Agregar dominio) y agrégalo

### **Paso 4: Obtener Credenciales OAuth (Opcional pero Recomendado)**

Para producción, es recomendable configurar tus propias credenciales OAuth:

1. Ve a: https://console.cloud.google.com/
2. Selecciona el proyecto: **verificandoando-40ad5**
3. En el menú lateral, ve a **"APIs & Services"** > **"Credentials"**
4. Haz clic en **"Create Credentials"** > **"OAuth 2.0 Client ID"**
5. Selecciona **"Web application"**
6. Configura:
   - **Name**: `Verifireando Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (desarrollo)
     - `https://www.verificandoando.com.mx` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/__/auth/handler` (desarrollo)
     - `https://www.verificandoando.com.mx/__/auth/handler` (producción)
7. Haz clic en **"Create"**
8. Copia el **Client ID** y **Client Secret**

### **Paso 5: Actualizar Configuración en Firebase (Si usaste OAuth personalizado)**

1. Regresa a Firebase Console
2. Ve a **Authentication** > **Sign-in method** > **Google**
3. Expande **"Web SDK configuration"**
4. Pega tu **Web client ID** (del paso 4)
5. Pega tu **Web client secret** (del paso 4)
6. Guarda los cambios

---

## 🔧 Verificar Configuración en el Código

### **Frontend: Verificar que Firebase esté inicializado**

Archivo: `frontend/src/firebase.new.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCCNpyJvoWTBsqCWzk2pWCXzOSV9Zovd3Q",
  authDomain: "verificandoando-40ad5.firebaseapp.com",
  projectId: "verificandoando-40ad5",
  storageBucket: "verificandoando-40ad5.firebasestorage.app",
  messagingSenderId: "579182347944",
  appId: "1:579182347944:web:13e672da1ceeea9779649d",
  measurementId: "G-HNTB1DG6GV"
}
```

✅ Esta configuración ya está correcta.

### **Frontend: Verificar variable de entorno**

Crea o actualiza el archivo `.env` en `frontend/`:

```env
VITE_USE_FIREBASE_AUTH=true
VITE_API_URL=https://api.verificandoando.com.mx
VITE_FIREBASE_API_KEY=AIzaSyCCNpyJvoWTBsqCWzk2pWCXzOSV9Zovd3Q
VITE_FIREBASE_AUTH_DOMAIN=verificandoando-40ad5.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=verificandoando-40ad5
VITE_FIREBASE_STORAGE_BUCKET=verificandoando-40ad5.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=579182347944
VITE_FIREBASE_APP_ID=1:579182347944:web:13e672da1ceeea9779649d
VITE_FIREBASE_MEASUREMENT_ID=G-HNTB1DG6GV
```

### **Backend: Configurar Firebase Admin**

El backend necesita las credenciales de Firebase Admin para verificar tokens.

Archivo: `backend/.env`

Necesitas agregar las credenciales de Firebase Admin. Hay dos formas:

#### **Opción 1: JSON completo (Recomendado)**

1. Ve a Firebase Console
2. Ve a **Project Settings** (⚙️) > **Service accounts**
3. Haz clic en **"Generate new private key"**
4. Descarga el archivo JSON
5. Copia todo el contenido del JSON y agrégalo como una variable de entorno:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"verificandoando-40ad5",...}
```

#### **Opción 2: Variables separadas**

```env
FIREBASE_PROJECT_ID=verificandoando-40ad5
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@verificandoando-40ad5.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
```

---

## 🧪 Probar la Configuración

### **Prueba en Desarrollo (Local)**

1. Asegúrate de que el frontend esté corriendo: `npm run dev`
2. Ve a: `http://localhost:5173/auth/register`
3. Haz clic en **"Continuar con Google"**
4. Debería abrirse un popup de Google
5. Selecciona tu cuenta
6. Deberías ser redirigido al dashboard

### **Prueba en Producción**

1. Ve a: `https://www.verificandoando.com.mx/auth/register`
2. Haz clic en **"Continuar con Google"**
3. Debería redirigirte a Google
4. Selecciona tu cuenta
5. Google te redirigirá de vuelta al sitio
6. Deberías estar autenticado

---

## 🐛 Solución de Problemas

### **Error: "Google login solo está disponible con Firebase Auth"**

**Causa:** La variable `VITE_USE_FIREBASE_AUTH` no está configurada o es `false`.

**Solución:**
```env
# frontend/.env
VITE_USE_FIREBASE_AUTH=true
```

Luego reconstruye el frontend:
```bash
cd frontend
npm run build
```

### **Error: "Popup bloqueado"**

**Causa:** El navegador bloqueó el popup de Google.

**Solución:** 
- Permite popups para tu sitio
- O usa modo de redirect (automático en producción)

### **Error: "auth/unauthorized-domain"**

**Causa:** El dominio no está autorizado en Firebase.

**Solución:**
1. Ve a Firebase Console > Authentication > Sign-in method
2. Desplázate a "Authorized domains"
3. Agrega tu dominio

### **Error: "Token de Google inválido"**

**Causa:** Firebase Admin no está configurado en el backend.

**Solución:**
1. Configura las credenciales de Firebase Admin (ver arriba)
2. Reinicia el servidor backend

### **Error: "CORS"**

**Causa:** El backend no permite requests desde tu dominio.

**Solución:**
Verifica que el backend tenga configurado CORS correctamente:

```javascript
// backend/server.js
const cors = require('cors')
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://www.verificandoando.com.mx',
    'https://verificandoando.com.mx'
  ],
  credentials: true
}))
```

---

## ✅ Checklist de Configuración

Marca cada paso cuando lo completes:

### **Firebase Console:**
- [ ] Google Sign-In habilitado en Authentication
- [ ] Email de soporte configurado
- [ ] Dominios autorizados agregados (localhost, tu dominio)
- [ ] (Opcional) Credenciales OAuth personalizadas creadas

### **Frontend:**
- [ ] Archivo `.env` creado con `VITE_USE_FIREBASE_AUTH=true`
- [ ] Firebase configurado en `firebase.new.js`
- [ ] Botón "Continuar con Google" visible en `/auth/register`
- [ ] Frontend reconstruido y desplegado

### **Backend:**
- [ ] Credenciales de Firebase Admin configuradas en `.env`
- [ ] Endpoint `/api/auth/google` funcional
- [ ] CORS configurado correctamente
- [ ] Backend reiniciado

### **Pruebas:**
- [ ] Login con Google funciona en desarrollo
- [ ] Login con Google funciona en producción
- [ ] Usuario se crea correctamente en MongoDB
- [ ] JWT se genera correctamente
- [ ] Redirección al dashboard funciona

---

## 📞 Soporte

Si después de seguir todos estos pasos aún tienes problemas:

1. Revisa los logs del navegador (F12 > Console)
2. Revisa los logs del backend
3. Verifica que todas las variables de entorno estén correctas
4. Asegúrate de haber reconstruido y redesplegado después de los cambios

---

## 🎯 Resumen

**Para que Google Sign-In funcione necesitas:**

1. ✅ Habilitar Google en Firebase Console
2. ✅ Agregar dominios autorizados
3. ✅ Configurar `VITE_USE_FIREBASE_AUTH=true` en frontend
4. ✅ Configurar Firebase Admin en backend
5. ✅ Reconstruir y redesplegar

**Una vez configurado, el flujo es:**
Usuario → Clic en Google → Popup/Redirect → Selecciona cuenta → Backend verifica → Usuario autenticado ✅
