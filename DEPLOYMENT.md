# 🚀 Guía de Deployment - Verifireando

Esta guía te ayudará a desplegar la aplicación Verifireando en producción siguiendo las mejores prácticas.

## 📋 Requisitos Previos

- [ ] Cuenta en Ámbar Hosting (para el backend)
- [ ] Cuenta en Netlify o Vercel (para el frontend)
- [ ] Cuenta en MongoDB Atlas
- [ ] Cuenta en Firebase (para Storage y Push Notifications)
- [ ] Cuentas en servicios de pago (Stripe/MercadoPago)
- [ ] Cuenta en WhatsApp Business API (opcional)

## 🗄️ 1. Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito (M0)
3. Región recomendada: **Virginia (us-east)** o **Oregon (us-west)**
4. Crea un usuario y contraseña para la base de datos
5. Configura acceso de red:
   - Para pruebas: `0.0.0.0/0` (todas las IPs)
   - Para producción: IPs específicas de tu hosting
6. Obtén el connection string:
   ```
   mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/verifireando
   ```

## 🖼️ 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Habilita **Firebase Storage**
4. Habilita **Cloud Messaging** (para push notifications)
5. Ve a **Configuración del proyecto** → **General** → **Tus apps**
6. Registra una nueva app web
7. Copia las credenciales de configuración

## 🧱 3. Desplegar Backend en Ámbar Hosting

### Preparación del Backend

1. Asegúrate de que `package.json` tenga el script start correcto:
   ```json
   {
     "scripts": {
       "start": "node app.js"
     }
   }
   ```

2. Crea el archivo `.env` en producción con estas variables:

```env
# === CONFIGURACIÓN GENERAL ===
NODE_ENV=production
PORT=5000
APP_NAME=Verifireando
APP_VERSION=1.0.0

# === BASE DE DATOS ===
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/verifireando
DB_NAME=verifireando

# === AUTENTICACIÓN JWT ===
JWT_SECRET=tu_clave_super_secreta_de_al_menos_32_caracteres
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=otra_clave_super_secreta_para_refresh_tokens
JWT_REFRESH_EXPIRES_IN=30d

# === FRONTEND URL ===
FRONTEND_URL=https://tu-app.netlify.app
ALLOWED_ORIGINS=https://tu-app.netlify.app,https://tu-dominio-personalizado.com

# === FIREBASE ===
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_privada\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com

# === PAGOS - MERCADOPAGO ===
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_mercadopago
MERCADOPAGO_PUBLIC_KEY=tu_public_key_de_mercadopago
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret

# === PAGOS - STRIPE ===
STRIPE_SECRET_KEY=sk_live_tu_clave_secreta_de_stripe
STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_publica_de_stripe
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret

# === WHATSAPP BUSINESS API ===
WHATSAPP_TOKEN=tu_token_de_whatsapp_business
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_VERIFY_TOKEN=tu_verify_token_personalizado

# === EMAIL ===
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM="Verifireando <noreply@verifireando.com>"

# === CLOUDINARY (OPCIONAL) ===
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# === SEGURIDAD ===
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://tu-app.netlify.app

# === LOGGING ===
LOG_LEVEL=info
LOG_FILE=logs/app.log

# === SESIONES ===
SESSION_SECRET=otra_clave_super_secreta_para_sesiones
SESSION_MAX_AGE=86400000

# === UPLOADS ===
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf

# === CACHE ===
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# === MONITOREO ===
SENTRY_DSN=tu_sentry_dsn_opcional
```

### Pasos en Ámbar Hosting

1. Entra a tu cPanel de Ámbar Hosting
2. Crea una nueva aplicación Node.js
3. Selecciona Node.js versión 18 o 20
4. Sube tu código:
   - **Opción A**: Sube un ZIP de la carpeta backend
   - **Opción B**: Conecta tu repositorio GitHub
5. En "Application startup file" pon: `app.js`
6. Configura todas las variables de entorno listadas arriba
7. Haz clic en **Start App**
8. Verifica que funcione visitando: `https://tu-dominio.com/api/health`

### Verificación del Backend

```bash
# Prueba estos endpoints:
curl https://tu-dominio.com/api/health
curl https://tu-dominio.com/api/auth/test
```

## 🌐 4. Desplegar Frontend

### Variables de Entorno del Frontend

Crea el archivo `.env.production` en la carpeta frontend:

```env
# === API ===
VITE_API_URL=https://tu-backend.ambarhosting.com/api

# === FIREBASE ===
VITE_FIREBASE_API_KEY=tu_api_key_de_firebase
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-firebase
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# === STRIPE ===
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_publica_de_stripe

# === MERCADOPAGO ===
VITE_MERCADOPAGO_PUBLIC_KEY=tu_public_key_de_mercadopago

# === MAPBOX ===
VITE_MAPBOX_ACCESS_TOKEN=tu_mapbox_access_token

# === PWA ===
VITE_PWA_NAME=Verifireando
VITE_PWA_SHORT_NAME=Verifireando
VITE_PWA_DESCRIPTION=Plataforma de verificación vehicular

# === ANALYTICS ===
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_HOTJAR_ID=tu_hotjar_id

# === CONFIGURACIÓN ===
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_ENABLE_CACHE=true
VITE_ENABLE_DEBUG=false

# === URLs EXTERNAS ===
VITE_SUPPORT_URL=https://soporte.verifireando.com
VITE_TERMS_URL=https://verifireando.com/terminos
VITE_PRIVACY_URL=https://verifireando.com/privacidad

# === NOTIFICACIONES ===
VITE_VAPID_PUBLIC_KEY=tu_vapid_public_key

# === REDES SOCIALES ===
VITE_FACEBOOK_URL=https://facebook.com/verifireando
VITE_TWITTER_URL=https://twitter.com/verifireando
VITE_INSTAGRAM_URL=https://instagram.com/verifireando
```

### Opción A: Netlify

1. Ve a [Netlify](https://www.netlify.com)
2. Conecta tu repositorio GitHub
3. Configuración de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `frontend`
4. Agrega todas las variables de entorno en Site Settings → Environment Variables
5. Deploy site

### Opción B: Vercel

1. Ve a [Vercel](https://vercel.com)
2. "Add new project" → conecta GitHub
3. Selecciona la carpeta `frontend` como root directory
4. Vercel detecta automáticamente React
5. Agrega las variables de entorno
6. Deploy

## 🔧 5. Configuraciones Post-Deployment

### CORS en el Backend

Asegúrate de que el backend tenga configurado CORS correctamente:

```javascript
// Ya está configurado en app.js
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:5173',
      'https://localhost:5173'
    ].filter(Boolean)

    if (process.env.NODE_ENV === 'development') {
      callback(null, true)
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  },
  credentials: true
}
```

### Webhooks

Configura los webhooks en los servicios externos:

1. **Stripe**: `https://tu-backend.com/api/payments/stripe/webhook`
2. **MercadoPago**: `https://tu-backend.com/api/payments/mercadopago/webhook`
3. **WhatsApp**: `https://tu-backend.com/api/whatsapp/webhook`

### SSL/HTTPS

- Ámbar Hosting: Habilita SSL en el cPanel
- Netlify/Vercel: SSL automático
- Asegúrate de que todas las URLs usen HTTPS

## 🧪 6. Testing en Producción

### Checklist de Verificación

- [ ] Backend responde en `/api/health`
- [ ] Frontend carga correctamente
- [ ] Login/registro funciona
- [ ] Base de datos se conecta
- [ ] Subida de imágenes funciona
- [ ] Notificaciones push funcionan
- [ ] Pagos funcionan (modo test primero)
- [ ] WhatsApp funciona (si está habilitado)
- [ ] PWA se instala correctamente

### URLs de Prueba

```bash
# Backend
https://tu-backend.com/api/health
https://tu-backend.com/api/auth/test

# Frontend
https://tu-app.netlify.app
https://tu-app.netlify.app/manifest.json
```

## 🔒 7. Seguridad

### Variables de Entorno Seguras

- Nunca commitees archivos `.env` al repositorio
- Usa claves JWT de al menos 32 caracteres
- Cambia todas las claves por defecto
- Usa HTTPS en producción
- Configura rate limiting
- Valida todas las entradas

### Monitoreo

- Configura logs en producción
- Usa Sentry para error tracking (opcional)
- Monitorea el uso de la base de datos
- Configura alertas de uptime

## 🚨 8. Troubleshooting

### Errores Comunes

1. **CORS Error**: Verifica `FRONTEND_URL` en el backend
2. **Database Connection**: Verifica `MONGO_URI` y whitelist de IPs
3. **Firebase Error**: Verifica todas las credenciales de Firebase
4. **Build Fails**: Verifica que todas las variables `VITE_*` estén configuradas
5. **404 en rutas**: Configura redirects en Netlify/Vercel

### Logs

```bash
# Ver logs en Ámbar Hosting
# Ve a cPanel → Node.js → Application Logs

# Ver logs en Netlify
# Ve a Site → Functions → View logs

# Ver logs en Vercel
# Ve a Project → Functions → View logs
```

## 📞 Soporte

Si tienes problemas durante el deployment:

1. Revisa los logs de la aplicación
2. Verifica que todas las variables de entorno estén configuradas
3. Prueba cada servicio por separado
4. Consulta la documentación de cada plataforma

---

**¡Listo! Tu aplicación Verifireando debería estar funcionando en producción.** 🎉