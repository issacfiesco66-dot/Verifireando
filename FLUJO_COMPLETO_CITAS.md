# Flujo Completo de Citas - Verifireando

## Descripción del Flujo

### 1. Cliente Crea Cita
- Cliente agrega un vehículo (si no lo tiene)
- Cliente crea una cita con:
  - **pickupAddress**: Ubicación donde el chofer recogerá el auto (REQUERIDA)
  - **deliveryAddress**: Ubicación donde el chofer entregará el auto después de verificar (REQUERIDA)
  - Fecha y hora programada
  - Servicios (verificación + servicios adicionales)

### 2. Asignación de Chofer
- El sistema busca choferes en línea disponibles
- Se asigna automáticamente al chofer más cercano a `pickupAddress`
- **Estado inicial**: `pending` → `assigned`
- Se genera automáticamente un **código de 6 dígitos** (`pickupCode`)
- El cliente recibe notificación con el código

### 3. Chofer Acepta la Cita
- Chofer puede ver la cita en su dashboard o mapa
- Chofer hace clic en "Aceptar" si aún está `pending`
- Si ya está asignada automáticamente, el chofer ve los detalles directamente
- **Estado**: `assigned`
- Chofer recibe notificación con el código `pickupCode` que debe mostrar al cliente

### 4. Chofer Va por el Auto
- Chofer navega hacia `pickupAddress` (ubicación de recogida)
- Chofer puede ver la dirección completa y coordenadas
- **Estado**: `assigned` o `driver_enroute` (cuando el chofer inicia la navegación)
- El cliente puede ver en tiempo real la ubicación del chofer (si el chofer comparte ubicación)

### 5. Cliente Verifica al Chofer (CUANDO EL CHOFER LLEGA)
- Cuando el chofer llega, muestra el código `pickupCode` al cliente
- El cliente ingresa el código en la app
- Se llama al endpoint `/api/appointments/:id/verify-pickup-code`
- Si el código es correcto:
  - **Estado cambia a**: `picked_up` (si estaba `driver_enroute`) o `driver_enroute` (si estaba `assigned`)
  - Si el chofer ya había llegado y está en `driver_enroute`, cambia a `picked_up`
- Si el código es incorrecto:
  - Error: "Código de verificación inválido"
  - El chofer NO puede continuar

### 6. Chofer Recoge el Auto
- Una vez verificado el código, el chofer confirma recogida
- **Estado**: `picked_up`
- El chofer puede ver la dirección de entrega (`deliveryAddress`)

### 7. Chofer Va a Verificar el Auto
- Chofer maneja hacia el centro de verificación o realiza la verificación en el lugar
- **Estado**: `in_verification`
- El cliente puede ver en tiempo real la ubicación del chofer
- Chofer realiza los servicios solicitados

### 8. Chofer Completa Verificación
- Chofer marca las tareas como completadas
- **Estado**: `completed`
- Se genera certificado de verificación

### 9. Chofer Entrega el Auto
- Chofer navega hacia `deliveryAddress` (ubicación de entrega)
- Cuando llega, confirma entrega
- **Estado**: `delivered`
- Chofer queda disponible nuevamente

## Estados de la Cita

```
pending → assigned → driver_enroute → picked_up → in_verification → completed → delivered
                          ↓
                    (si el cliente verifica código)
```

## Códigos y Verificación

### pickupCode (Código de Recogida)
- **Generación**: Se genera automáticamente cuando:
  1. Un chofer acepta una cita
  2. Un chofer es asignado automáticamente
- **Formato**: 6 dígitos numéricos (100000-999999)
- **Propósito**: Permite al cliente verificar que el chofer que llegó es el correcto
- **Verificación**: El cliente ingresa el código cuando el chofer llega
- **Endpoint**: `POST /api/appointments/:id/verify-pickup-code`

## Ubicaciones

### pickupAddress (Ubicación de Recogida)
- **Formato en BD**: GeoJSON `{type: 'Point', coordinates: [lng, lat]}`
- **Formato en API**: Transformado a `location` con `latitude`, `longitude`, `address`, etc.
- **Uso**: Donde el chofer recoge el auto del cliente

### deliveryAddress (Ubicación de Entrega)
- **Formato en BD**: GeoJSON `{type: 'Point', coordinates: [lng, lat]}` o `{lat, lng}`
- **Formato en API**: Transformado a `deliveryLocation` con `latitude`, `longitude`, `address`, etc.
- **Uso**: Donde el chofer entrega el auto después de verificar

## Endpoints Importantes

### Para Choferes
- `GET /api/appointments/my-appointments` - Obtener citas asignadas al chofer
- `GET /api/appointments/driver/available` - Ver citas disponibles para aceptar
- `PUT /api/appointments/:id/accept` - Aceptar una cita pendiente
- `GET /api/appointments/:id` - Ver detalles de la cita (incluye `location` y `deliveryLocation`)
- `PUT /api/appointments/:id/status` - Actualizar estado de la cita

### Para Clientes
- `POST /api/appointments` - Crear nueva cita
- `GET /api/appointments/my-appointments` - Ver mis citas
- `GET /api/appointments/:id` - Ver detalles de la cita (incluye `location` y `pickupCode`)
- `POST /api/appointments/:id/verify-pickup-code` - Verificar código cuando el chofer llega

## Notificaciones en Tiempo Real (Socket.IO)

### Eventos Emitidos
- `appointment-created` - Nueva cita creada (para choferes)
- `appointment-assigned` - Cita asignada (para cliente y chofer)
- `appointment-updated` - Estado de cita actualizado
- `driver-location-updated` - Ubicación del chofer actualizada (para cliente)

### Salas (Rooms)
- `user-{userId}` - Sala del cliente/usuario
- `driver-{driverId}` - Sala del chofer
- `appointment-{appointmentId}` - Sala de la cita

## Frontend

### Componentes Clave
- **Cliente**:
  - `AppointmentDetails.jsx` - Muestra detalles, código de verificación, ubicación
  - `NewAppointment.jsx` - Crear cita con pickupAddress y deliveryAddress
  
- **Chofer**:
  - `DriverDashboard.jsx` - Ver citas asignadas, aceptar citas
  - `DriverAppointments.jsx` - Lista de citas
  - `AppointmentDetails.jsx` - Ver detalles, ubicación de recogida y entrega
  - `Map.jsx` - Mapa con ubicaciones de citas
