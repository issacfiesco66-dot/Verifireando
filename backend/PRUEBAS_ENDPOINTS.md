# Guía de Pruebas de Endpoints - Verifireando API

Esta guía contiene todas las pruebas para los endpoints del proyecto Verifireando.

## Configuración Inicial

**Base URL:** `http://localhost:5000` (o el puerto configurado)

## Variables Globales
Guarda estos valores después de cada prueba exitosa:
- `{{clientToken}}` - Token de autenticación del cliente
- `{{driverToken}}` - Token de autenticación del chofer
- `{{adminToken}}` - Token de autenticación del admin
- `{{carId}}` - ID del vehículo creado
- `{{appointmentId}}` - ID de la cita creada
- `{{driverId}}` - ID del chofer

---

## 1. HEALTH CHECK

### 1.1 Health Check Principal
```http
GET /health
```

**Respuesta esperada:** 200 OK
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

### 1.2 Health Check API
```http
GET /api/health
```

**Respuesta esperada:** 200 OK

---

## 2. DIAGNOSTICS

### 2.1 Información del Sistema
```http
GET /api/diagnostics
```

**Respuesta esperada:** 200 OK
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "env": "development",
  "firebase": {
    "initialized": true
  },
  "config": {
    "hasMongoUri": true,
    "hasJwtSecret": true
  }
}
```

---

## 3. AUTENTICACIÓN (AUTH)

### 3.1 Registro de Cliente
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Cliente Test",
  "email": "cliente@test.com",
  "phone": "+525512345678",
  "password": "password123",
  "role": "client"
}
```

**Respuesta esperada:** 201 Created
```json
{
  "message": "Usuario registrado exitosamente",
  "userId": "64abc123...",
  "needsVerification": true
}
```

### 3.2 Registro de Chofer
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Chofer Test",
  "email": "chofer@test.com",
  "phone": "+525587654321",
  "password": "password123",
  "role": "driver",
  "licenseNumber": "LIC123456",
  "licenseExpiry": "2025-12-31",
  "vehicleInfo": {
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "plates": "ABC-123-D",
    "color": "Blanco"
  }
}
```

**Respuesta esperada:** 201 Created

### 3.3 Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "cliente@test.com",
  "password": "password123",
  "role": "client"
}
```

**Respuesta esperada:** 200 OK
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64abc123...",
    "name": "Cliente Test",
    "email": "cliente@test.com",
    "role": "client"
  }
}
```

**Guardar:** `token` como `{{clientToken}}`

### 3.4 Verificar OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "cliente@test.com",
  "code": "123456",
  "role": "client"
}
```

**Respuesta esperada:** 200 OK

### 3.5 Reenviar OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "cliente@test.com",
  "role": "client"
}
```

**Respuesta esperada:** 200 OK

### 3.6 Obtener Perfil
```http
GET /api/auth/profile
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK
```json
{
  "user": {
    "id": "64abc123...",
    "name": "Cliente Test",
    "email": "cliente@test.com",
    "role": "client"
  },
  "role": "client"
}
```

### 3.7 Actualizar Perfil
```http
PUT /api/auth/profile
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "name": "Cliente Actualizado",
  "phone": "+525599999999"
}
```

**Respuesta esperada:** 200 OK

### 3.8 Cambiar Contraseña
```http
PUT /api/auth/change-password
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Respuesta esperada:** 200 OK

### 3.9 Google Sign-In
```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google-id-token",
  "email": "usuario@gmail.com",
  "name": "Usuario Google",
  "photoURL": "https://..."
}
```

**Respuesta esperada:** 200 OK

### 3.10 Logout
```http
POST /api/auth/logout
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

---

## 4. SERVICIOS (SERVICES)

### 4.1 Obtener Todos los Servicios
```http
GET /api/services
```

**Respuesta esperada:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc...",
      "name": "Verificación Vehicular",
      "code": "verification",
      "category": "verificacion",
      "price": 500,
      "description": "...",
      "isActive": true
    }
  ]
}
```

### 4.2 Obtener Servicios con Filtros
```http
GET /api/services?category=verificacion&popular=true&limit=5
```

**Respuesta esperada:** 200 OK

### 4.3 Obtener Servicio por ID
```http
GET /api/services/:id
```

**Respuesta esperada:** 200 OK

### 4.4 Obtener Categorías
```http
GET /api/services/categories/list
```

**Respuesta esperada:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "code": "verificacion",
      "name": "Verificación",
      "count": 5
    }
  ]
}
```

### 4.5 Buscar Servicios
```http
GET /api/services/search?q=verificacion
```

**Respuesta esperada:** 200 OK

---

## 5. VEHÍCULOS (CARS)

### 5.1 Crear Vehículo
```http
POST /api/cars
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "plates": "XYZ-789-A",
  "brand": "Honda",
  "model": "Civic",
  "year": 2021,
  "color": "Negro",
  "vin": "VIN123456789"
}
```

**Respuesta esperada:** 201 Created
```json
{
  "message": "Vehículo registrado exitosamente",
  "car": {
    "_id": "64abc...",
    "plates": "XYZ-789-A",
    "brand": "Honda",
    "model": "Civic"
  }
}
```

**Guardar:** `car._id` como `{{carId}}`

### 5.2 Obtener Mis Vehículos
```http
GET /api/cars
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK
```json
{
  "cars": [
    {
      "_id": "64abc...",
      "plates": "XYZ-789-A",
      "brand": "Honda",
      "model": "Civic",
      "isActive": true
    }
  ]
}
```

### 5.3 Obtener Vehículo por ID
```http
GET /api/cars/{{carId}}
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 5.4 Actualizar Vehículo
```http
PUT /api/cars/{{carId}}
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "color": "Azul",
  "notes": "Vehículo actualizado"
}
```

**Respuesta esperada:** 200 OK

### 5.5 Desactivar Vehículo
```http
DELETE /api/cars/{{carId}}
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

---

## 6. CHOFERES (DRIVERS)

### 6.1 Obtener Todos los Choferes
```http
GET /api/drivers
```

**Respuesta esperada:** 200 OK
```json
{
  "drivers": [
    {
      "_id": "64abc...",
      "name": "Chofer Test",
      "rating": 4.5,
      "isOnline": true,
      "isAvailable": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

### 6.2 Buscar Choferes
```http
GET /api/drivers?search=test&isOnline=true
```

**Respuesta esperada:** 200 OK

### 6.3 Obtener Chofer por ID
```http
GET /api/drivers/:id
```

**Respuesta esperada:** 200 OK

### 6.4 Obtener Estadísticas del Chofer (Autenticado)
```http
GET /api/drivers/stats
Authorization: Bearer {{driverToken}}
```

**Respuesta esperada:** 200 OK
```json
{
  "totalAppointments": 10,
  "completedAppointments": 8,
  "cancelledAppointments": 2,
  "monthlyAppointments": 5,
  "monthlyEarnings": 5000,
  "rating": 4.5,
  "totalRatings": 8
}
```

### 6.5 Obtener Información del Vehículo del Chofer
```http
GET /api/drivers/vehicle
Authorization: Bearer {{driverToken}}
```

**Respuesta esperada:** 200 OK

### 6.6 Actualizar Información del Vehículo
```http
PUT /api/drivers/vehicle
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2021,
  "plates": "NEW-123-D",
  "color": "Rojo"
}
```

**Respuesta esperada:** 200 OK

### 6.7 Actualizar Ubicación del Chofer
```http
PUT /api/drivers/:id/location
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "lat": 19.4326,
  "lng": -99.1332
}
```

**Respuesta esperada:** 200 OK

### 6.8 Cambiar Estado Online/Offline
```http
PUT /api/drivers/:id/online-status
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "isOnline": true
}
```

**Respuesta esperada:** 200 OK

### 6.9 Cambiar Disponibilidad
```http
PUT /api/drivers/:id/availability
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "isAvailable": true
}
```

**Respuesta esperada:** 200 OK

---

## 7. CITAS (APPOINTMENTS)

### 7.1 Crear Cita
```http
POST /api/appointments
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "car": "{{carId}}",
  "scheduledDate": "2024-12-30",
  "scheduledTime": "10:00",
  "services": {
    "verification": true,
    "additionalServices": [
      {
        "name": "wash",
        "price": 100
      }
    ]
  },
  "pickupAddress": {
    "street": "Calle Test 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "zipCode": "01000",
    "coordinates": {
      "lat": 19.4326,
      "lng": -99.1332
    }
  },
  "deliveryAddress": {
    "street": "Calle Test 456",
    "city": "Ciudad de México",
    "state": "CDMX",
    "zipCode": "01000",
    "coordinates": {
      "lat": 19.4326,
      "lng": -99.1332
    }
  },
  "notes": "Por favor llegar temprano"
}
```

**Respuesta esperada:** 201 Created
```json
{
  "message": "Cita creada exitosamente",
  "appointment": {
    "_id": "64abc...",
    "appointmentNumber": "APT-20241228-001",
    "status": "pending",
    "client": {...},
    "car": {...}
  },
  "driverAssigned": false
}
```

**Guardar:** `appointment._id` como `{{appointmentId}}`

### 7.2 Obtener Mis Citas
```http
GET /api/appointments
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 7.3 Obtener Mis Citas (Alias)
```http
GET /api/appointments/my-appointments
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 7.4 Obtener Cita por ID
```http
GET /api/appointments/{{appointmentId}}
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 7.5 Actualizar Estado de Cita
```http
PUT /api/appointments/{{appointmentId}}/status
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "status": "assigned",
  "notes": "Chofer asignado",
  "location": {
    "lat": 19.4326,
    "lng": -99.1332
  }
}
```

**Respuesta esperada:** 200 OK

### 7.6 Asignar Chofer Manualmente (Admin)
```http
PUT /api/appointments/{{appointmentId}}/assign-driver
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "driverId": "{{driverId}}"
}
```

**Respuesta esperada:** 200 OK

### 7.7 Cancelar Cita
```http
PUT /api/appointments/{{appointmentId}}/cancel
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "reason": "No puedo asistir"
}
```

**Respuesta esperada:** 200 OK

### 7.8 Calificar Servicio
```http
POST /api/appointments/{{appointmentId}}/rating
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excelente servicio"
}
```

**Respuesta esperada:** 200 OK

### 7.9 Obtener Citas Disponibles (Chofer)
```http
GET /api/appointments/driver/available
Authorization: Bearer {{driverToken}}
```

**Respuesta esperada:** 200 OK

### 7.10 Aceptar Cita (Chofer)
```http
PUT /api/appointments/{{appointmentId}}/accept
Authorization: Bearer {{driverToken}}
```

**Respuesta esperada:** 200 OK

### 7.11 Marcar Servicio como Completado
```http
PUT /api/appointments/{{appointmentId}}/services/wash/complete
Authorization: Bearer {{driverToken}}
```

**Respuesta esperada:** 200 OK

### 7.12 Agregar Evidencia a Servicio
```http
POST /api/appointments/{{appointmentId}}/services/wash/evidence
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "url": "https://example.com/photo.jpg",
  "description": "Foto del servicio completado"
}
```

**Respuesta esperada:** 200 OK

---

## 8. PAGOS (PAYMENTS)

### 8.1 Validar Cupón
```http
POST /api/payments/validate-coupon
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "code": "DESCUENTO10",
  "amount": 500,
  "serviceCodes": ["verification"]
}
```

**Respuesta esperada:** 200 OK

### 8.2 Crear Payment Intent
```http
POST /api/payments/create-payment-intent
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "appointmentId": "{{appointmentId}}",
  "paymentMethod": "card",
  "currency": "MXN",
  "couponCode": "DESCUENTO10"
}
```

**Respuesta esperada:** 200 OK

### 8.3 Confirmar Pago
```http
POST /api/payments/confirm
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "paymentIntentId": "pi_123456",
  "paymentMethod": "card"
}
```

**Respuesta esperada:** 200 OK

### 8.4 Obtener Mis Pagos
```http
GET /api/payments
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 8.5 Obtener Pago por ID
```http
GET /api/payments/:id
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 8.6 Solicitar Reembolso
```http
POST /api/payments/:id/refund
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "amount": 500,
  "reason": "requested_by_customer",
  "notes": "No se realizó el servicio"
}
```

**Respuesta esperada:** 200 OK

---

## 9. NOTIFICACIONES (NOTIFICATIONS)

### 9.1 Obtener Mis Notificaciones
```http
GET /api/notifications
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 9.2 Contar Notificaciones No Leídas
```http
GET /api/notifications/unread/count
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK
```json
{
  "count": 5
}
```

### 9.3 Marcar Notificación como Leída
```http
PUT /api/notifications/:id/read
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 9.4 Marcar Todas como Leídas
```http
PUT /api/notifications/read-all
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 9.5 Eliminar Notificación
```http
DELETE /api/notifications/:id
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 200 OK

### 9.6 Actualizar Token FCM
```http
PUT /api/notifications/fcm-token
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "fcmToken": "fcm-token-123456"
}
```

**Respuesta esperada:** 200 OK

---

## 10. USUARIOS (USERS - Admin)

### 10.1 Obtener Todos los Usuarios
```http
GET /api/users
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

### 10.2 Buscar Usuarios
```http
GET /api/users?search=test&role=client&isActive=true
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

### 10.3 Obtener Usuario por ID
```http
GET /api/users/:id
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

### 10.4 Actualizar Usuario
```http
PUT /api/users/:id
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "Usuario Actualizado",
  "isActive": true
}
```

**Respuesta esperada:** 200 OK

### 10.5 Desactivar Usuario
```http
DELETE /api/users/:id
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

---

## 11. ADMIN

### 11.1 Obtener Estadísticas del Dashboard
```http
GET /api/admin/dashboard/stats
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK
```json
{
  "clients": 100,
  "drivers": 20,
  "appointments": 500,
  "pendingAppointments": 10
}
```

### 11.2 Obtener Configuración
```http
GET /api/admin/settings
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

### 11.3 Actualizar Configuración
```http
PUT /api/admin/settings
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "siteName": "Verifireando",
  "maintenance": false,
  "allowRegistrations": true
}
```

**Respuesta esperada:** 200 OK

### 11.4 Obtener Usuarios (Vista Admin)
```http
GET /api/admin/users?page=1&limit=20&search=test
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

### 11.5 Obtener Choferes (Vista Admin)
```http
GET /api/admin/drivers?page=1&limit=20&status=online
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

### 11.6 Obtener Citas (Vista Admin)
```http
GET /api/admin/appointments?page=1&limit=20&status=pending
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

### 11.7 Obtener Reportes
```http
GET /api/admin/reports?type=appointments&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {{adminToken}}
```

**Respuesta esperada:** 200 OK

---

## 12. PRUEBAS DE VALIDACIÓN Y ERRORES

### 12.1 Endpoint No Existente
```http
GET /api/ruta-inexistente
```

**Respuesta esperada:** 404 Not Found

### 12.2 Sin Token de Autenticación
```http
GET /api/cars
```

**Respuesta esperada:** 401 Unauthorized

### 12.3 Token Inválido
```http
GET /api/cars
Authorization: Bearer token-invalido
```

**Respuesta esperada:** 401 Unauthorized

### 12.4 Sin Permisos (Cliente intentando acceder a Admin)
```http
GET /api/admin/dashboard/stats
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 403 Forbidden

### 12.5 Datos Inválidos
```http
POST /api/cars
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "plates": "AB",
  "year": 1800
}
```

**Respuesta esperada:** 400 Bad Request

### 12.6 Recurso No Encontrado
```http
GET /api/cars/64abc123456789012345678
Authorization: Bearer {{clientToken}}
```

**Respuesta esperada:** 404 Not Found

---

## Notas Importantes

1. **Autenticación**: La mayoría de los endpoints requieren un token JWT en el header `Authorization: Bearer {token}`

2. **Roles**: 
   - `client` - Cliente normal
   - `driver` - Chofer
   - `admin` - Administrador

3. **Paginación**: Muchos endpoints soportan `?page=1&limit=10`

4. **Filtros**: Varios endpoints soportan filtros por query params

5. **Verificación**: Los usuarios nuevos necesitan verificar su cuenta con OTP antes de poder usar la mayoría de funcionalidades

6. **Rate Limiting**: La API tiene límites de solicitudes por IP (100 en producción, 1000 en desarrollo)

---

## Ejecutar Pruebas Automatizadas

Para ejecutar las pruebas automatizadas con Jest:

```bash
cd backend
npm test
```

Para ejecutar con cobertura:

```bash
npm run test:coverage
```

Para ejecutar en modo watch:

```bash
npm run test:watch
```
