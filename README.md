# 🚗 Verifireando

**Sistema de verificación vehicular a domicilio**

Plataforma web que conecta usuarios con conductores certificados para realizar verificaciones vehiculares a domicilio.

---

## 📋 Características

- ✅ Solicitud de citas de verificación vehicular
- 📍 Geolocalización con Mapbox
- 💳 Pagos integrados con Stripe
- 🔐 Autenticación JWT + Firebase
- 📱 PWA con notificaciones push
- 👥 Roles: Cliente, Conductor, Admin
- 🗺️ Tracking en tiempo real (próximamente)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 18 + Vite
- **Estilos:** TailwindCSS
- **Routing:** React Router v6
- **Mapas:** Mapbox GL JS
- **Auth:** Firebase Authentication
- **HTTP:** Axios
- **Estado:** Context API
- **PWA:** Workbox

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Base de datos:** MongoDB + Mongoose
- **Autenticación:** JWT
- **Pagos:** Stripe
- **Logging:** Winston
- **Process Manager:** PM2

---
```

### URLs de desarrollo

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## 🔧 Scripts Disponibles

### Desarrollo
```bash
npm run dev              # Inicia backend y frontend
npm run dev:backend      # Solo backend
npm run dev:frontend     # Solo frontend
```

### Producción
```bash
npm run build:production # Build completo para producción
npm run deploy:prepare   # Prepara para deployment
```

### Testing y Calidad
```bash
npm run test            # Tests de backend y frontend
npm run lint            # Linting de ambos proyectos
```

### Utilidades
```bash
npm run seed            # Sembrar base de datos
npm run clean           # Limpiar node_modules y builds
```

## 📁 Estructura del Proyecto

### Backend (`/backend`)
```
backend/
├── app.js              # Aplicación principal
├── config/             # Configuraciones
├── controllers/        # Controladores de rutas
├── middleware/         # Middlewares personalizados
├── models/             # Modelos de MongoDB
├── routes/             # Definición de rutas
├── services/           # Lógica de negocio
├── utils/              # Utilidades y helpers
└── scripts/            # Scripts de utilidad
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── contexts/       # Context API de React
│   ├── services/       # Servicios y API calls
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utilidades
│   └── assets/         # Recursos estáticos
├── public/             # Archivos públicos
└── dist/               # Build de producción
```

## 🔐 Variables de Entorno

### Backend
Copia `backend/.env.production.example` y configura:

- `MONGO_URI` - Conexión a MongoDB
- `JWT_SECRET` - Clave secreta para JWT
- `FIREBASE_*` - Credenciales de Firebase
- `STRIPE_*` - Claves de Stripe
- `MERCADOPAGO_*` - Claves de MercadoPago
- `WHATSAPP_*` - API de WhatsApp Business

### Frontend
Copia `frontend/.env.production.example` y configura:

- `VITE_API_URL` - URL del backend
- `VITE_FIREBASE_*` - Configuración de Firebase
- `VITE_STRIPE_*` - Claves públicas de Stripe
- `VITE_MAPBOX_*` - Token de Mapbox

## 🚀 Deployment

Para deployment en producción, consulta la **[Guía de Deployment](DEPLOYMENT.md)** que incluye:

- 🧱 Ámbar Hosting (Backend)
- 🌐 Netlify/Vercel (Frontend)
- 🗄️ MongoDB Atlas
- 🖼️ Firebase Storage
- 💳 Configuración de pagos
- 🔒 Configuración de seguridad

### Build Automático

```bash
# Ejecuta el script de build completo
npm run build:production
```

Este script:
- ✅ Verifica la estructura del proyecto
- 📦 Instala dependencias
- 🧹 Ejecuta linting y tests
- 🏗️ Construye el frontend optimizado
- 📊 Genera reporte de build

## 🧪 Testing

### Credenciales de Prueba

Después de ejecutar `npm run seed`:

**Clientes:**
- `juan@example.com` / `password123`
- `maria@example.com` / `password123`

**Conductores:**
- `roberto@example.com` / `driver123`
- `ana@example.com` / `driver123`

**Administrador:**
- `admin@verifireando.com` / `admin123`

## 🛠️ Tecnologías

### Backend
- **Node.js** + **Express** - API REST
- **MongoDB** + **Mongoose** - Base de datos
- **JWT** - Autenticación
- **Socket.IO** - WebSockets
- **Firebase Admin** - Push notifications
- **Stripe/MercadoPago** - Pagos
- **Nodemailer** - Emails
- **Winston** - Logging

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navegación
- **React Hook Form** - Formularios
- **Axios** - HTTP client
- **Socket.IO Client** - WebSockets
- **Firebase** - Storage y push notifications
- **PWA** - Progressive Web App

## 📱 Características PWA

- ✅ **Instalable** - Se puede instalar como app
- ✅ **Offline** - Funciona sin conexión
- ✅ **Push Notifications** - Notificaciones nativas
- ✅ **Responsive** - Adaptable a cualquier dispositivo
- ✅ **Fast** - Carga rápida con Service Workers

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- 📧 Email: soporte@verifireando.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/verifireando/issues)
- 📖 Documentación: [Wiki](https://github.com/tu-usuario/verifireando/wiki)

---

**Desarrollado con ❤️ por el equipo de Verifireando**