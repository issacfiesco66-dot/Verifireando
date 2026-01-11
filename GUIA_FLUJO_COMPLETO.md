# Guía del Flujo Completo - Verifireando

## 🎯 Cómo Funciona el Sistema Completo

### **Paso 1: Cliente Crea una Cita**
1. Cliente va a `/client/appointments/new`
2. Selecciona un vehículo (o agrega uno nuevo)
3. **ESTABLECE UBICACIÓN DE RECOGIDA** (`pickupAddress`):
   - Dirección completa
   - Coordenadas GPS
   - Instrucciones especiales (opcional)
4. **ESTABLECE UBICACIÓN DE ENTREGA** (`deliveryAddress`):
   - Donde quiere que le entreguen el auto después de verificar
   - Puede ser la misma que recogida
5. Selecciona servicios (verificación + adicionales)
6. Programa fecha y hora
7. **Cita se crea con estado: `pending`**

---

### **Paso 2: Sistema Asigna Chofer (Automático o Manual)**

#### **Opción A: Asignación Automática**
- Si hay choferes en línea y disponibles cerca de `pickupAddress`
- El sistema busca el más cercano (dentro de 20km)
- **Estado cambia a: `assigned`**
- **Se genera código de 6 dígitos** (`pickupCode`)

#### **Opción B: Chofer Acepta Manualmente**
- Chofer está en línea (`isOnline: true`)
- Ve sección **"Citas Disponibles"** en su Dashboard
- Hace clic en **"Aceptar"** en una cita `pending`
- **Estado cambia a: `assigned`**
- **Se genera código de 6 dígitos** (`pickupCode`)

---

### **Paso 3: Chofer Ve la Cita en su Dashboard**
- **Citas Asignadas**: Muestra todas sus citas (`assigned`, `driver_enroute`, `picked_up`, etc.)
- **Citas Disponibles**: Muestra citas `pending` que puede aceptar (solo si está en línea)

**En Detalles de la Cita:**
- **Código de verificación**: Se muestra grande para que el chofer lo vea
- **Ubicación de recogida**: `location` con mapa y dirección completa
- **Ubicación de entrega**: `deliveryLocation` con mapa (visible cuando está en `completed`)
- **Información del cliente**: Nombre, teléfono, email
- **Información del vehículo**: Marca, modelo, placas, año

---

### **Paso 4: Chofer Va por el Auto**
1. Chofer hace clic en **"Iniciar viaje a recogida"**
   - **Estado cambia a: `driver_enroute`**
2. Chofer navega usando botón "Navegar" o Google Maps
   - Se abre con coordenadas de `location` (pickupAddress)
3. **El cliente puede ver la ubicación del chofer en tiempo real** (Socket.IO)

---

### **Paso 5: Cliente Verifica al Chofer (CUANDO EL CHOFER LLEGA)**
1. Cuando el chofer llega a la ubicación de recogida
2. **El chofer muestra el código** `pickupCode` al cliente
3. **El cliente ingresa el código** en su app (aparece cuando hay chofer asignado)
4. Se llama `POST /api/appointments/:id/verify-pickup-code`
5. Si el código es correcto:
   - **Estado cambia a: `picked_up`** (si estaba `driver_enroute`)
   - El chofer puede continuar
6. Si el código es incorrecto:
   - Error: "Código de verificación inválido"
   - El chofer NO puede continuar

---

### **Paso 6: Chofer Recoge el Auto**
1. Chofer confirma recogida (si no se hizo automático en paso 5)
   - **Estado: `picked_up`**
2. Ahora el chofer puede ver:
   - **Ubicación de entrega** (`deliveryLocation`) en los detalles
   - Instrucciones de entrega

---

### **Paso 7: Chofer Va a Verificar el Auto**
1. Chofer maneja al centro de verificación o realiza verificación en el lugar
2. Chofer hace clic en **"Iniciar verificación"**
   - **Estado cambia a: `in_verification`**
3. Chofer realiza los servicios solicitados:
   - Verificación vehicular (obligatoria)
   - Servicios adicionales (si los hay)
4. Chofer puede subir fotos/evidencia
5. **El cliente ve en tiempo real:**
   - Ubicación actual del chofer
   - Estado de la cita
   - Notificaciones en tiempo real

---

### **Paso 8: Chofer Completa Verificación**
1. Chofer marca servicios como completados
2. Chofer hace clic en **"Completar verificación"**
   - **Estado cambia a: `completed`**
3. Se genera certificado de verificación
4. **Ahora el chofer puede ver la ubicación de entrega** (`deliveryLocation`)

---

### **Paso 9: Chofer Entrega el Auto**
1. Chofer navega a `deliveryLocation` (ubicación de entrega que el cliente estableció)
2. Chofer hace clic en **"Entregar vehículo"**
   - **Estado cambia a: `delivered`**
3. Chofer queda disponible nuevamente (`isAvailable: true`)
4. El cliente puede calificar al chofer

---

## 📍 Dónde se Muestra Cada Cosa

### **Para el Cliente:**
- **Dashboard** (`/client/dashboard`): Estadísticas y citas recientes
- **Mis Citas** (`/client/appointments`): Lista de todas sus citas
- **Detalles de Cita** (`/client/appointments/:id`):
  - Información del chofer asignado
  - **Código de verificación** (para verificar cuando el chofer llegue)
  - Ubicación de recogida en mapa
  - Ubicación en tiempo real del chofer (Socket.IO)
  - Estado actual de la cita

### **Para el Chofer:**
- **Dashboard** (`/driver/dashboard`):
  - **Citas Disponibles**: Citas `pending` que puede aceptar (solo si está en línea)
  - **Citas Asignadas**: Sus citas asignadas
  - Botón para conectarse/desconectarse
- **Mis Citas** (`/driver/appointments`): Lista de todas sus citas
- **Mapa** (`/driver/map`): Mapa con ubicaciones de citas
- **Detalles de Cita** (`/driver/appointments/:id`):
  - **Código de verificación** (grande, para mostrar al cliente)
  - **Ubicación de recogida** (`location`) con mapa
  - **Ubicación de entrega** (`deliveryLocation`) con mapa (cuando está disponible)
  - Información del cliente
  - Información del vehículo
  - Botones de acciones según el estado

---

## 🔄 Estados de la Cita y Transiciones

```
pending (sin chofer)
    ↓
[Chofer acepta o sistema asigna]
    ↓
assigned (chofer asignado, código generado)
    ↓
[Chofer inicia viaje]
    ↓
driver_enroute (chofer en camino)
    ↓
[Cliente verifica código] → picked_up (auto recogido)
    ↓
[Chofer inicia verificación]
    ↓
in_verification (en verificación)
    ↓
[Chofer completa servicios]
    ↓
completed (verificación completada)
    ↓
[Chofer entrega auto]
    ↓
delivered (entregado)
```

---

## 🔑 Código de Verificación

### **Generación:**
- Se genera automáticamente cuando:
  1. Un chofer acepta una cita manualmente
  2. Un chofer es asignado automáticamente por el sistema
- Es un número de 6 dígitos (100000-999999)
- Se guarda en `appointment.pickupCode`

### **Verificación:**
- **Endpoint**: `POST /api/appointments/:id/verify-pickup-code`
- Solo el cliente puede verificar
- Si el código es correcto:
  - Estado cambia a `driver_enroute` o `picked_up`
  - El chofer puede continuar
- Si el código es incorrecto:
  - Error 400: "Código de verificación inválido"
  - El chofer NO puede continuar

### **Dónde se Muestra:**
- **Cliente**: En detalles de cita, cuando hay chofer asignado y estado es `assigned` o `driver_enroute`
- **Chofer**: En detalles de cita, cuando estado es `assigned` o `driver_enroute`

---

## 📍 Ubicaciones

### **pickupAddress (Ubicación de Recogida)**
- **Cuándo se establece**: Cuando el cliente crea la cita
- **Formato en BD**: GeoJSON `{type: 'Point', coordinates: [lng, lat]}`
- **Formato en API**: Se transforma a `location` con:
  - `latitude`, `longitude`
  - `address` (calle, ciudad, estado)
  - `coordinates` [lng, lat]
- **Dónde se muestra**:
  - **Chofer**: En Dashboard, detalles de cita, mapa
  - **Cliente**: En detalles de cita

### **deliveryAddress (Ubicación de Entrega)**
- **Cuándo se establece**: Cuando el cliente crea la cita
- **Formato en BD**: GeoJSON o `{lat, lng}`
- **Formato en API**: Se transforma a `deliveryLocation` con:
  - `latitude`, `longitude`
  - `address` (calle, ciudad, estado)
  - `coordinates` [lng, lat]
- **Dónde se muestra**:
  - **Chofer**: En detalles de cita (visible cuando estado es `completed` o después)
  - **Cliente**: En detalles de cita

---

## 🔔 Notificaciones en Tiempo Real

### **Eventos Socket.IO:**
- `appointment-created`: Nueva cita creada (para choferes)
- `appointment-assigned`: Cita asignada (para cliente y chofer)
- `appointment-updated`: Estado actualizado (para ambos)
- `new-appointment-available`: Nueva cita disponible para aceptar (para choferes)
- `driver-location-updated`: Ubicación del chofer actualizada (para cliente)

### **Notificaciones Push:**
- Cuando se asigna un chofer
- Cuando el chofer llega
- Cuando se verifica el código
- Cuando se completa la verificación
- Cuando se entrega el auto

---

## ✅ Checklist del Flujo

- [ ] Cliente puede crear cita con pickupAddress y deliveryAddress
- [ ] Cita se crea con estado `pending`
- [ ] Chofer en línea ve citas disponibles en Dashboard
- [ ] Chofer puede aceptar citas `pending`
- [ ] Se genera código cuando se asigna chofer
- [ ] Chofer ve código en detalles de cita
- [ ] Cliente ve código en detalles de cita
- [ ] Chofer ve ubicación de recogida (`location`)
- [ ] Chofer puede cambiar estado a `driver_enroute`
- [ ] Cliente puede verificar código cuando chofer llega
- [ ] Estado cambia a `picked_up` cuando se verifica código
- [ ] Chofer puede cambiar estado a `in_verification`
- [ ] Chofer puede cambiar estado a `completed`
- [ ] Chofer ve ubicación de entrega (`deliveryLocation`) cuando está `completed`
- [ ] Chofer puede cambiar estado a `delivered`
- [ ] Cliente ve ubicación del chofer en tiempo real

---

## 🐛 Problemas Comunes y Soluciones

### **Problema: Chofer no ve citas disponibles**
- **Solución**: Verificar que esté en línea (`isOnline: true`)
- **Solución**: Verificar que el endpoint `/driver/available` esté funcionando
- **Solución**: Verificar que haya citas con `status: 'pending'` y `driver: null`

### **Problema: Código no se muestra**
- **Solución**: Verificar que el chofer esté asignado (`appointment.driver` existe)
- **Solución**: Verificar que el estado sea `assigned` o `driver_enroute`
- **Solución**: Verificar que `pickupCode` se generó en el backend

### **Problema: Ubicación no disponible**
- **Solución**: Verificar que `pickupAddress` tenga `coordinates`
- **Solución**: Verificar que la transformación a `location` funcione
- **Solución**: Verificar que el frontend use `appointment.location` (no `appointment.pickupAddress`)

### **Problema: Cliente no puede verificar código**
- **Solución**: Verificar que el estado sea `assigned` o `driver_enroute`
- **Solución**: Verificar que el código ingresado coincida con `appointment.pickupCode`
- **Solución**: Verificar que el endpoint `/verify-pickup-code` esté funcionando

---

## 📝 Endpoints Clave

```
GET  /api/appointments/my-appointments         # Mis citas (cliente o chofer)
GET  /api/appointments/driver/available        # Citas disponibles para chofer (pending sin asignar)
PUT  /api/appointments/:id/accept              # Aceptar cita (chofer)
POST /api/appointments/:id/verify-pickup-code  # Verificar código (cliente)
GET  /api/appointments/:id                     # Detalles de cita (con location y deliveryLocation)
PUT  /api/appointments/:id/status              # Actualizar estado (chofer)
```

---

## 🚀 Cómo Probar el Flujo Completo

1. **Crear cuenta de cliente** y agregar un vehículo
2. **Crear cuenta de chofer** y conectarse (estar en línea)
3. **Cliente crea cita** con pickupAddress y deliveryAddress
4. **Chofer ve cita disponible** en Dashboard (si está en línea)
5. **Chofer acepta cita** → Se genera código
6. **Verificar que ambos vean el código**
7. **Chofer inicia viaje** → Estado: `driver_enroute`
8. **Cliente verifica código** → Estado: `picked_up`
9. **Chofer inicia verificación** → Estado: `in_verification`
10. **Chofer completa** → Estado: `completed`
11. **Chofer ve ubicación de entrega** (`deliveryLocation`)
12. **Chofer entrega** → Estado: `delivered`

---

**Documentación actualizada**: El flujo completo está implementado y documentado. Todos los componentes necesarios están en su lugar.
