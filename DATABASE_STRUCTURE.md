# Estructura de Base de Datos MongoDB - Verifireando

## Resumen de Colecciones

El sistema utiliza **8 colecciones principales** en MongoDB:

1. **users** - Clientes y administradores
2. **drivers** - Choferes verificadores
3. **cars** - Vehículos de los clientes
4. **appointments** - Citas de verificación
5. **payments** - Pagos y transacciones
6. **services** - Catálogo de servicios
7. **notifications** - Notificaciones del sistema
8. **coupons** - Cupones de descuento

---

## 1. Colección: `users`

**Descripción:** Almacena información de clientes y administradores del sistema.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  name: String (requerido, max 100 caracteres),
  email: String (requerido, único, lowercase),
  phone: String (requerido, formato: +52XXXXXXXXXX),
  password: String (requerido, hasheado, min 6 caracteres),
  role: String (enum: ['client', 'admin'], default: 'client'),
  
  // Verificación
  isVerified: Boolean (default: false),
  verificationCode: String,
  verificationCodeExpires: Date,
  
  // Recuperación de contraseña
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Dirección
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { lat: Number, lng: Number }
  },
  
  // Notificaciones Push
  fcmToken: String,
  pushSubscription: Object,
  userAgent: String,
  lastPushSubscriptionUpdate: Date,
  
  // Preferencias
  preferences: {
    notifications: {
      push: Boolean (default: true),
      whatsapp: Boolean (default: true),
      email: Boolean (default: true)
    },
    language: String (default: 'es')
  },
  
  // Autenticación
  authProvider: String (enum: ['local', 'google'], default: 'local'),
  photoURL: String,
  lastLogin: Date,
  isActive: Boolean (default: true),
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `email` (único)
- `phone`
- `address.coordinates` (2dsphere para búsquedas geoespaciales)

### Métodos:
- `comparePassword(candidatePassword)` - Compara contraseñas
- `generateVerificationCode()` - Genera código de 6 dígitos
- `verifyCode(code)` - Verifica código de verificación
- `toJSON()` - Limpia datos sensibles

---

## 2. Colección: `drivers`

**Descripción:** Almacena información de los choferes verificadores.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  name: String (requerido, max 100 caracteres),
  email: String (requerido, único, lowercase),
  phone: String (requerido, formato: +52XXXXXXXXXX),
  password: String (requerido, hasheado, min 6 caracteres),
  role: String (default: 'driver'),
  
  // Licencia
  licenseNumber: String (requerido, único),
  licenseExpiry: Date (requerido),
  
  // Información del vehículo
  vehicleInfo: {
    brand: String (requerido),
    model: String (requerido),
    year: Number (requerido),
    plates: String (requerido, único),
    color: String (requerido),
    photos: [String]
  },
  
  // Documentos
  documents: {
    license: String,
    vehicleRegistration: String,
    insurance: String,
    criminalRecord: String
  },
  
  // Ubicación en tiempo real
  location: {
    type: String (enum: ['Point'], default: 'Point'),
    coordinates: [Number] // [longitude, latitude]
  },
  lastLocationUpdate: Date,
  
  // Estado
  isOnline: Boolean (default: false),
  isAvailable: Boolean (default: false),
  isVerified: Boolean (default: false),
  verificationStatus: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  verificationNotes: String,
  
  // Calificación y estadísticas
  rating: {
    average: Number (default: 0),
    count: Number (default: 0)
  },
  completedTrips: Number (default: 0),
  
  // Ganancias
  earnings: {
    total: Number (default: 0),
    pending: Number (default: 0),
    paid: Number (default: 0)
  },
  
  // Horario de trabajo
  workingHours: {
    start: String, // "08:00"
    end: String,   // "18:00"
    days: [String] // ["monday", "tuesday", ...]
  },
  
  // Notificaciones
  fcmToken: String,
  pushSubscription: Object,
  userAgent: String,
  lastPushSubscriptionUpdate: Date,
  
  // Información bancaria
  bankInfo: {
    accountNumber: String,
    bankName: String,
    accountHolder: String,
    clabe: String
  },
  
  // Verificación
  verificationCode: String,
  verificationCodeExpires: Date,
  isActive: Boolean (default: true),
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `email` (único)
- `phone`
- `licenseNumber` (único)
- `vehicleInfo.plates` (único)
- `location` (2dsphere para búsquedas geoespaciales)
- `isOnline, isAvailable` (compuesto)

### Métodos:
- `comparePassword(candidatePassword)` - Compara contraseñas
- `generateVerificationCode()` - Genera código de verificación
- `updateLocation(lat, lng)` - Actualiza ubicación
- `distanceTo(lat, lng)` - Calcula distancia a un punto
- `updateRating(newRating)` - Actualiza calificación
- `toJSON()` - Limpia datos sensibles

---

## 3. Colección: `cars`

**Descripción:** Almacena información de los vehículos de los clientes.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  owner: ObjectId (ref: 'User', requerido),
  
  // Información básica
  plates: String (requerido, único, uppercase, formato: [A-Z0-9]{6,8}),
  brand: String (requerido),
  model: String (requerido),
  year: Number (requerido, min: 1990),
  color: String (requerido),
  engineType: String (enum: ['gasoline', 'diesel', 'hybrid', 'electric'], default: 'gasoline'),
  
  // Documentos
  documents: {
    registration: {
      number: String,
      expiry: Date,
      photo: String
    },
    insurance: {
      company: String,
      policyNumber: String,
      expiry: Date,
      photo: String
    }
  },
  
  // Fotos del vehículo
  photos: [String],
  
  // Historial de verificaciones
  verificationHistory: [{
    date: Date (requerido),
    center: String,
    result: String (enum: ['approved', 'rejected', 'pending'], requerido),
    certificate: String,
    nextVerificationDue: Date,
    notes: String
  }],
  
  // Próxima verificación
  nextVerificationDue: Date,
  isActive: Boolean (default: true),
  
  // Metadatos técnicos
  metadata: {
    vin: String,
    engineNumber: String,
    cylinderCapacity: Number,
    fuelType: String,
    transmission: String (enum: ['manual', 'automatic'])
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `owner`
- `plates` (único)
- `nextVerificationDue`
- `verificationHistory.date` (descendente)
- `owner, isActive` (compuesto)

### Métodos:
- `needsVerification()` - Verifica si necesita verificación
- `getLastVerification()` - Obtiene última verificación
- `addVerification(data)` - Agrega nueva verificación
- `isOverdue()` - Verifica si está vencido
- `getDaysUntilDue()` - Días hasta vencimiento
- `getVerificationStatus()` - Estado actual

### Virtuals:
- `fullName` - Nombre completo del vehículo (marca modelo año)

---

## 4. Colección: `appointments`

**Descripción:** Almacena las citas de verificación vehicular.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  client: ObjectId (ref: 'User', requerido),
  car: ObjectId (ref: 'Car', requerido),
  driver: ObjectId (ref: 'Driver'),
  
  // Identificación
  appointmentNumber: String (único, auto-generado: VER2025000001),
  
  // Programación
  scheduledDate: Date (requerido),
  timeSlot: {
    start: String (requerido), // "09:00"
    end: String (requerido)     // "10:00"
  },
  
  // Servicios
  services: {
    verification: Boolean (default: true, requerido),
    additionalServices: [{
      name: String (enum: servicios disponibles, requerido),
      price: Number (requerido),
      description: String,
      completed: Boolean (default: false),
      completedAt: Date,
      evidence: [{
        url: String,
        description: String,
        uploadedAt: Date
      }]
    }]
  },
  
  // Direcciones
  pickupAddress: {
    street: String (requerido),
    city: String (requerido),
    state: String (requerido),
    zipCode: String,
    coordinates: {
      type: String (enum: ['Point'], default: 'Point'),
      coordinates: [Number] // [longitude, latitude]
    },
    instructions: String
  },
  
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { lat: Number, lng: Number },
    instructions: String,
    sameAsPickup: Boolean (default: true)
  },
  
  // Estado
  status: String (enum: [
    'pending',           // Pendiente de asignación
    'assigned',          // Chofer asignado
    'driver_enroute',    // Chofer en camino
    'picked_up',         // Vehículo recogido
    'in_verification',   // En verificación
    'completed',         // Verificación completada
    'delivered',         // Vehículo entregado
    'cancelled'          // Cancelada
  ], default: 'pending'),
  
  // Historial de estados
  statusHistory: [{
    status: String,
    timestamp: Date,
    notes: String,
    updatedBy: ObjectId,
    updatedByModel: String (enum: ['User', 'Driver'])
  }],
  
  // Precios
  pricing: {
    basePrice: Number (requerido),
    additionalServicesPrice: Number (default: 0),
    taxes: Number (default: 0),
    total: Number (requerido)
  },
  
  // Pago
  payment: ObjectId (ref: 'Payment'),
  
  // Resultado de verificación
  verificationResult: {
    passed: Boolean,
    certificate: String,
    issues: [String],
    notes: String,
    verificationCenter: String,
    verifiedAt: Date,
    nextVerificationDue: Date
  },
  
  // Línea de tiempo
  timeline: {
    created: Date,
    assigned: Date,
    pickedUp: Date,
    verificationStarted: Date,
    verificationCompleted: Date,
    delivered: Date,
    cancelled: Date
  },
  
  // Calificaciones
  rating: {
    clientRating: {
      score: Number (min: 1, max: 5),
      comment: String,
      ratedAt: Date
    },
    driverRating: {
      score: Number (min: 1, max: 5),
      comment: String,
      ratedAt: Date
    }
  },
  
  // Otros
  notes: String,
  cancellationReason: String,
  estimatedDuration: Number, // minutos
  actualDuration: Number,    // minutos
  isUrgent: Boolean (default: false),
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `client`
- `driver`
- `car`
- `scheduledDate`
- `status`
- `pickupAddress.coordinates.coordinates` (2dsphere)
- `status, scheduledDate` (compuesto)
- `driver, status` (compuesto)

### Métodos:
- `updateStatus(newStatus, notes)` - Actualiza estado
- `assignDriver(driverId)` - Asigna chofer
- `calculateTotal()` - Calcula precio total
- `canBeCancelled()` - Verifica si puede cancelarse

---

## 5. Colección: `payments`

**Descripción:** Almacena información de pagos y transacciones.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  appointment: ObjectId (ref: 'Appointment', requerido),
  client: ObjectId (ref: 'User', requerido),
  
  // Identificación
  paymentNumber: String (único, auto-generado: PAY2025000001),
  
  // Montos
  amount: {
    subtotal: Number (requerido),
    discount: Number (default: 0),
    taxes: Number (requerido),
    total: Number (requerido)
  },
  
  coupon: ObjectId (ref: 'Coupon'),
  currency: String (enum: ['MXN', 'USD'], default: 'MXN'),
  
  // Método y proveedor
  method: String (enum: ['card', 'cash', 'transfer', 'wallet'], requerido),
  provider: String (enum: ['stripe', 'mercadopago', 'cash'], requerido),
  
  // Estado
  status: String (enum: [
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'refunded',
    'partial_refund'
  ], default: 'pending'),
  
  // Información del proveedor de pago
  paymentIntent: {
    stripePaymentIntentId: String,
    stripeClientSecret: String,
    mercadopagoId: String,
    mercadopagoStatus: String,
    providerResponse: Mixed
  },
  
  // Campos directos (compatibilidad)
  stripePaymentIntentId: String,
  stripeChargeId: String,
  
  // Detalles del pago
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    receiptUrl: String,
    transactionId: String
  },
  
  // Línea de tiempo
  timeline: {
    created: Date,
    authorized: Date,
    captured: Date,
    completed: Date,
    failed: Date,
    cancelled: Date,
    refunded: Date
  },
  
  // Reembolsos
  refunds: [{
    amount: Number (requerido),
    reason: String,
    notes: String,
    refundId: String,
    processedAt: Date,
    processedBy: ObjectId,
    status: String (enum: ['pending', 'completed', 'failed'])
  }],
  
  // Comisiones
  fees: {
    platformFee: Number (default: 0),
    processingFee: Number (default: 0),
    driverEarnings: Number (default: 0)
  },
  
  // Recibo
  receipt: {
    number: String,
    url: String,
    emailSent: Boolean (default: false),
    emailSentAt: Date
  },
  
  // Metadatos
  metadata: {
    ipAddress: String,
    userAgent: String,
    paymentSource: String, // 'web', 'mobile', 'admin'
    notes: String
  },
  
  // Webhooks
  webhookEvents: [{
    eventType: String,
    eventId: String,
    receivedAt: Date,
    processed: Boolean,
    data: Mixed
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `appointment`
- `client`
- `status`
- `stripePaymentIntentId`
- `stripeChargeId`
- `paymentIntent.stripePaymentIntentId`
- `paymentIntent.mercadopagoId`
- `createdAt` (descendente)
- `client, status` (compuesto)
- `status, createdAt` (compuesto)

### Métodos:
- `updateStatus(newStatus, metadata)` - Actualiza estado
- `processRefund(amount, reason, notes)` - Procesa reembolso
- `calculateFees()` - Calcula comisiones
- `generateReceipt()` - Genera recibo
- `canBeRefunded()` - Verifica si puede reembolsarse
- `addWebhookEvent(type, id, data)` - Agrega evento webhook

### Virtuals:
- `refundableAmount` - Monto disponible para reembolso

---

## 6. Colección: `services`

**Descripción:** Catálogo de servicios disponibles.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  name: String (requerido, único),
  code: String (requerido, único, enum: códigos de servicio),
  description: String (requerido),
  category: String (enum: ['verification', 'maintenance', 'repair', 'cleaning'], requerido),
  basePrice: Number (requerido, min: 0),
  driverCommission: Number (requerido, min: 0, max: 100),
  estimatedDuration: Number (requerido, min: 1), // minutos
  isActive: Boolean (default: true),
  
  requirements: [{
    type: String,
    description: String
  }],
  
  icon: String (default: 'wrench'),
  color: String (default: '#3B82F6'),
  tags: [String],
  
  metadata: {
    popularity: Number (default: 0),
    averageRating: Number (default: 0),
    totalBookings: Number (default: 0)
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `code` (único)
- `category`
- `isActive`

### Códigos de Servicio Disponibles:
- `verification` - Verificación vehicular
- `wash` - Lavado de auto
- `oil_change` - Cambio de aceite
- `spark_plugs` - Cambio de bujías
- `brakes` - Frenos
- `air_filter` - Filtro de aire
- `tire_check` - Revisión de llantas
- `battery_check` - Revisión de batería
- `brake_check` - Revisión de frenos
- `transmission` - Transmisión
- `cooling_system` - Sistema de enfriamiento
- `electrical` - Sistema eléctrico
- `suspension` - Suspensión
- `exhaust` - Sistema de escape
- `fuel_system` - Sistema de combustible

---

## 7. Colección: `notifications`

**Descripción:** Sistema de notificaciones multicanal.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  recipient: ObjectId (requerido),
  recipientModel: String (enum: ['User', 'Driver'], requerido),
  
  type: String (enum: [
    'appointment_created',
    'appointment_assigned',
    'appointment_status',
    'new_appointment',
    'driver_enroute',
    'vehicle_picked_up',
    'verification_started',
    'verification_completed',
    'service_completed',
    'vehicle_delivered',
    'payment_completed',
    'appointment_cancelled',
    'driver_nearby',
    'verification_reminder',
    'rating_request',
    'promotion',
    'system_update'
  ], requerido),
  
  channel: String (enum: ['push', 'whatsapp', 'email', 'sms'], requerido),
  
  title: String (requerido, max: 100),
  message: String (requerido, max: 500),
  
  data: {
    appointmentId: ObjectId,
    driverId: ObjectId,
    paymentId: ObjectId,
    actionUrl: String,
    imageUrl: String,
    priority: String (enum: ['low', 'normal', 'high', 'urgent'], default: 'normal')
  },
  
  status: String (enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending'),
  
  deliveryDetails: {
    fcmMessageId: String,
    fcmResponse: Mixed,
    whatsappMessageId: String,
    whatsappStatus: String,
    emailMessageId: String,
    emailProvider: String,
    attempts: Number (default: 0),
    lastAttempt: Date,
    deliveredAt: Date,
    readAt: Date,
    errorMessage: String
  },
  
  scheduling: {
    scheduledFor: Date,
    timezone: String,
    isRecurring: Boolean (default: false),
    recurringPattern: String
  },
  
  template: {
    templateId: String,
    templateVariables: Mixed
  },
  
  metadata: {
    source: String,
    campaign: String,
    tags: [String],
    locale: String (default: 'es')
  },
  
  isRead: Boolean (default: false),
  readAt: Date,
  expiresAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `recipient, recipientModel`
- `type`
- `channel`
- `status`
- `createdAt` (descendente)
- `scheduling.scheduledFor`
- `expiresAt` (TTL index)
- `recipient, isRead, createdAt` (compuesto)
- `status, scheduling.scheduledFor` (compuesto)

### Métodos:
- `markAsSent(deliveryInfo)` - Marca como enviada
- `markAsRead()` - Marca como leída
- `markAsFailed(errorMessage)` - Marca como fallida
- `retry()` - Reintenta envío
- `canRetry()` - Verifica si puede reintentar
- `isExpired()` - Verifica si expiró

### Métodos Estáticos:
- `createAppointmentNotification()` - Crea notificación de cita
- `getUnreadCount(recipient, model)` - Cuenta no leídas
- `markAllAsRead(recipient, model)` - Marca todas como leídas

---

## 8. Colección: `coupons`

**Descripción:** Cupones de descuento.

### Campos Principales:
```javascript
{
  _id: ObjectId,
  code: String (requerido, único, uppercase),
  description: String (requerido),
  discountType: String (enum: ['percentage', 'fixed'], requerido),
  discountValue: Number (requerido, min: 0),
  minPurchase: Number (default: 0),
  maxDiscount: Number, // Solo para porcentaje
  validFrom: Date (default: Date.now),
  validUntil: Date (requerido),
  usageLimit: Number,
  usageCount: Number (default: 0),
  isActive: Boolean (default: true),
  applicableServices: [String], // Códigos de servicio
  
  createdAt: Date,
  updatedAt: Date
}
```

### Índices:
- `code` (único)
- `isActive`
- `validUntil`

### Métodos:
- `isValid(amount, serviceCodes)` - Valida cupón
- `calculateDiscount(amount)` - Calcula descuento

---

## Relaciones Entre Colecciones

```
users (clients)
  ├─→ cars (1:N)
  ├─→ appointments (1:N)
  ├─→ payments (1:N)
  └─→ notifications (1:N)

drivers
  ├─→ appointments (1:N)
  └─→ notifications (1:N)

cars
  ├─→ appointments (1:N)
  └─→ owner: users (N:1)

appointments
  ├─→ client: users (N:1)
  ├─→ driver: drivers (N:1)
  ├─→ car: cars (N:1)
  ├─→ payment: payments (1:1)
  └─→ services: services (N:N)

payments
  ├─→ appointment: appointments (1:1)
  ├─→ client: users (N:1)
  └─→ coupon: coupons (N:1)

notifications
  └─→ recipient: users|drivers (N:1)

coupons
  └─→ payments (1:N)

services
  └─→ appointments (N:N)
```

---

## Consideraciones de Diseño

### 1. **Índices Geoespaciales**
- `users.address.coordinates` (2dsphere)
- `drivers.location` (2dsphere)
- `appointments.pickupAddress.coordinates.coordinates` (2dsphere)

Estos índices permiten búsquedas eficientes de choferes cercanos y rutas optimizadas.

### 2. **Índices Compuestos**
Se utilizan para optimizar consultas frecuentes:
- Búsqueda de citas por cliente y estado
- Búsqueda de choferes disponibles
- Historial de pagos por cliente

### 3. **Soft Deletes**
Se usa `isActive` en lugar de eliminar registros para mantener integridad referencial e historial.

### 4. **Timestamps Automáticos**
Todas las colecciones tienen `createdAt` y `updatedAt` automáticos.

### 5. **Validación a Nivel de Esquema**
- Enums para valores predefinidos
- Validaciones de formato (email, teléfono, placas)
- Rangos numéricos (años, calificaciones)

### 6. **Seguridad**
- Contraseñas hasheadas con bcrypt (salt rounds: 12)
- Método `toJSON()` para limpiar datos sensibles
- Tokens de verificación con expiración

---

## Estado Actual: ✅ BIEN IMPLEMENTADO

Todas las colecciones están correctamente estructuradas con:
- ✅ Campos requeridos definidos
- ✅ Validaciones apropiadas
- ✅ Índices optimizados
- ✅ Relaciones bien establecidas
- ✅ Métodos de utilidad implementados
- ✅ Seguridad implementada (hashing, limpieza de datos)
- ✅ Soporte para búsquedas geoespaciales
- ✅ Historial y auditoría

**No se requieren cambios en la estructura de la base de datos.**
