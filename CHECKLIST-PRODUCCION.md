# Checklist para Producción - Verifireando

## ✅ Errores Corregidos

### 1. Backend
- [x] Esquemas de validación faltantes (`confirmPaymentSchema`, `refundSchema`) agregados
- [x] Referencias a `stripePaymentIntentId` corregidas (compatibilidad con campo directo y nested)
- [x] Método `getRefundableAmount()` corregido a `refundableAmount` (virtual)
- [x] Método `processRefund()` actualizado con parámetros adicionales
- [x] Esquema de `refunds` actualizado con campos `notes`, `processedBy`
- [x] Inconsistencia de moneda corregida (`mxn` → `MXN`)
- [x] `console.error` reemplazado por `logger` en `services.js`

### 2. Configuración
- [x] Archivo `.env.example` creado con todas las variables necesarias
- [x] Script de pruebas completo (`test-all-endpoints.js`) creado

## 🔍 Pendientes para Producción

### Seguridad

#### Variables de Entorno
- [ ] **CRÍTICO**: Cambiar `JWT_SECRET` a un valor seguro y único
- [ ] **CRÍTICO**: Configurar `MONGODB_URI` con credenciales de producción
- [ ] **CRÍTICO**: Configurar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de producción
- [ ] Configurar credenciales de Firebase para notificaciones push
- [ ] Configurar credenciales de WhatsApp Business API (si aplica)
- [ ] Configurar SMTP para envío de emails
- [ ] Configurar `MAPBOX_ACCESS_TOKEN` para mapas

#### CORS y Orígenes
- [ ] Configurar `FRONTEND_URL` con la URL de producción
- [ ] Configurar `ALLOWED_ORIGINS` con todos los dominios permitidos
- [ ] Revisar y ajustar políticas de CORS según necesidades

#### Rate Limiting
- [ ] Ajustar `RATE_LIMIT_MAX_REQUESTS` según capacidad del servidor
- [ ] Considerar rate limiting más estricto para endpoints de autenticación

### Base de Datos

#### MongoDB
- [ ] Configurar conexión a MongoDB Atlas o servidor de producción
- [ ] Configurar índices necesarios (ya están definidos en modelos)
- [ ] Configurar backups automáticos
- [ ] Configurar replicación si es necesario
- [ ] Revisar y optimizar queries lentas

#### Datos Iniciales
- [ ] Crear usuario administrador inicial
- [ ] Ejecutar script de seed para servicios básicos
- [ ] Verificar datos de prueba eliminados

### Pagos

#### Stripe
- [ ] Cambiar de modo test a producción en Stripe
- [ ] Configurar webhooks de Stripe con URL de producción
- [ ] Verificar que `STRIPE_WEBHOOK_SECRET` sea el correcto
- [ ] Probar flujo completo de pago en producción
- [ ] Configurar notificaciones de webhooks fallidos

#### MercadoPago (si aplica)
- [ ] Configurar credenciales de producción
- [ ] Configurar webhooks
- [ ] Probar integración

### Notificaciones

#### Firebase Cloud Messaging
- [ ] Configurar proyecto Firebase de producción
- [ ] Subir certificados/credenciales
- [ ] Probar envío de notificaciones push
- [ ] Configurar topics para notificaciones masivas

#### WhatsApp (si aplica)
- [ ] Configurar WhatsApp Business API
- [ ] Probar envío de OTP
- [ ] Configurar plantillas de mensajes

#### Email
- [ ] Configurar SMTP de producción
- [ ] Probar envío de emails
- [ ] Configurar plantillas de email
- [ ] Configurar SPF/DKIM para evitar spam

### Frontend

#### Build y Deploy
- [ ] Ejecutar `npm run build` en frontend
- [ ] Verificar que `dist/` se genera correctamente
- [ ] Configurar variables de entorno del frontend
- [ ] Verificar que las URLs de API apuntan a producción
- [ ] Configurar PWA (Service Workers, manifest)

#### Optimizaciones
- [ ] Minificar y comprimir assets
- [ ] Configurar CDN para assets estáticos
- [ ] Optimizar imágenes
- [ ] Configurar cache headers

### Servidor

#### Node.js
- [ ] Verificar versión de Node.js (requiere 22.x según package.json)
- [ ] Configurar `NODE_ENV=production`
- [ ] Configurar variables de entorno en el servidor
- [ ] Configurar logs (Winston ya configurado)
- [ ] Configurar rotación de logs

#### Proceso Manager
- [ ] Configurar PM2 o similar para mantener proceso activo
- [ ] Configurar auto-restart en caso de crash
- [ ] Configurar monitoreo de recursos

#### SSL/TLS
- [ ] Configurar certificado SSL válido
- [ ] Configurar redirección HTTP → HTTPS
- [ ] Verificar que todas las conexiones usan HTTPS

### Monitoreo y Logs

#### Logging
- [ ] Configurar `LOG_TO_CONSOLE=true` en producción (opcional)
- [ ] Configurar almacenamiento de logs (archivos, servicios externos)
- [ ] Configurar niveles de log apropiados
- [ ] Configurar alertas para errores críticos

#### Monitoreo
- [ ] Configurar monitoreo de uptime (UptimeRobot, Pingdom, etc.)
- [ ] Configurar alertas de errores (Sentry, Rollbar, etc.)
- [ ] Configurar monitoreo de performance
- [ ] Configurar alertas de recursos (CPU, memoria, disco)

### Testing

#### Pruebas Pre-Producción
- [ ] Ejecutar `npm test` en backend
- [ ] Ejecutar `npm test` en frontend
- [ ] Ejecutar script `test-all-endpoints.js`
- [ ] Probar registro de usuario
- [ ] Probar login (cliente, chofer, admin)
- [ ] Probar creación de cita
- [ ] Probar flujo de pago completo
- [ ] Probar notificaciones push
- [ ] Probar actualización de ubicación en tiempo real
- [ ] Probar panel administrativo

#### Pruebas de Carga
- [ ] Realizar pruebas de carga básicas
- [ ] Identificar cuellos de botella
- [ ] Optimizar endpoints lentos

### Documentación

- [ ] Documentar API endpoints (Swagger/OpenAPI)
- [ ] Documentar variables de entorno
- [ ] Documentar proceso de deploy
- [ ] Documentar troubleshooting común

### Backup y Recuperación

- [ ] Configurar backups automáticos de MongoDB
- [ ] Configurar backups de archivos/uploads
- [ ] Probar proceso de restauración
- [ ] Documentar procedimientos de recuperación

### Legal y Compliance

- [ ] Revisar términos y condiciones
- [ ] Revisar política de privacidad
- [ ] Configurar cookies consent (si aplica)
- [ ] Verificar cumplimiento de GDPR/LGPD (si aplica)
- [ ] Configurar manejo de datos personales

## 🚀 Comandos Útiles

### Backend
```bash
# Instalar dependencias
cd backend && npm install

# Ejecutar en producción
NODE_ENV=production npm start

# Ejecutar seed (solo primera vez)
npm run seed
```

### Frontend
```bash
# Instalar dependencias
cd frontend && npm install

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Testing
```bash
# Probar todos los endpoints
node test-all-endpoints.js

# Probar conexión
node testConnection.js
```

## 📝 Notas Importantes

1. **Nunca** commitear archivos `.env` con credenciales reales
2. **Siempre** usar variables de entorno para configuración sensible
3. **Verificar** que `NODE_ENV=production` esté configurado
4. **Revisar** logs regularmente para detectar errores
5. **Monitorear** uso de recursos (CPU, memoria, disco)
6. **Mantener** dependencias actualizadas y seguras

## ⚠️ Advertencias

- El sistema actualmente tiene fallback a base de datos en memoria si MongoDB falla (solo desarrollo)
- En producción, el sistema debe fallar si no puede conectar a MongoDB
- Revisar configuración de CORS antes de desplegar
- Verificar que todos los servicios externos (Stripe, Firebase, etc.) estén configurados correctamente

## 🔗 Recursos

- [Documentación de MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Documentación de Stripe](https://stripe.com/docs)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de Node.js](https://nodejs.org/docs/)



