# 🚗 Verifireando

**Plataforma de verificación vehicular** - Sistema completo con backend API y frontend PWA para gestionar citas de verificación vehicular.

## 📋 Características

- 🔐 **Autenticación completa** - Login, registro, recuperación de contraseña
- 👥 **Múltiples roles** - Cliente, Conductor, Administrador
- 📱 **PWA (Progressive Web App)** - Funciona como app móvil
- 🔔 **Notificaciones push** - Firebase Cloud Messaging
- 💳 **Pagos integrados** - Stripe y MercadoPago
- 📍 **Geolocalización** - Mapbox para ubicaciones
- 📊 **Dashboard administrativo** - Gestión completa del sistema
- 🚗 **Gestión de vehículos** - CRUD completo de autos
- 📅 **Sistema de citas** - Programación y seguimiento
- 💬 **Chat en tiempo real** - Socket.IO
- 📧 **Notificaciones por email** - Nodemailer
- 📱 **WhatsApp Business API** - Notificaciones por WhatsApp

## 🏗️ Arquitectura

```
verifireando/
├── backend/          # API REST con Node.js + Express
├── frontend/         # PWA con React + Vite
├── DEPLOYMENT.md     # Guía de deployment
└── build-production.js # Script de build automático
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 16+ 
- npm 8+
- MongoDB (local o Atlas)
- Firebase project (para storage y push notifications)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/verifireando.git
cd verifireando

# Instalar dependencias de ambos proyectos
npm run install:all

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar los archivos .env con tus credenciales

# Sembrar la base de datos (opcional)
npm run seed

# Iniciar en modo desarrollo
npm run dev
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