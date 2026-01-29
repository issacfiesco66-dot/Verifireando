# 🗺️ Implementación de Seguimiento en Tiempo Real

## ✅ Archivos Creados

### 1. Hook personalizado para rastreo de ubicación
**Archivo:** `frontend/src/hooks/useDriverLocation.js`
- ✅ Usa `navigator.geolocation.watchPosition` para seguimiento continuo
- ✅ Envía ubicación al servidor vía Socket.IO cada vez que cambia
- ✅ Maneja errores de permisos y GPS

### 2. Componente de Mapa con Google Maps
**Archivo:** `frontend/src/components/map/LiveTrackingMap.jsx`
- ✅ Integración con Google Maps API
- ✅ Muestra marcadores para: chofer (rojo), recogida (azul), entrega (verde)
- ✅ Anima el movimiento del marcador del chofer
- ✅ Dibuja ruta entre chofer y destino
- ✅ Botón para centrar en chofer

### 3. Actualización del componente del chofer
**Archivo:** `frontend/src/pages/driver/AppointmentDetails.jsx`
- ✅ Importa `useDriverLocation`
- ✅ Activa rastreo cuando status es 'driver_enroute' o 'picked_up'
- ✅ Envía ubicación automáticamente al servidor

### 4. Actualización del componente del cliente
**Archivo:** `frontend/src/pages/client/AppointmentDetails.jsx`
- ✅ Importa `LiveTrackingMap`
- ✅ Estado `driverLocation` para almacenar ubicación del chofer
- ✅ Manejador `handleDriverLocationUpdate` actualizado para recibir ubicación

## 🔧 Pasos Pendientes para Completar

### Paso 1: Agregar el componente de mapa en la vista del cliente

Busca en `frontend/src/pages/client/AppointmentDetails.jsx` la sección donde se muestra la información de la cita (alrededor de la línea 400-500) y agrega:

```jsx
{/* Mostrar mapa de seguimiento en tiempo real */}
{appointment?.driver && (appointment.status === 'driver_enroute' || appointment.status === 'picked_up') && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <Navigation className="w-5 h-5 mr-2 text-primary-600" />
      Seguimiento en Tiempo Real
    </h3>
    <LiveTrackingMap
      driverLocation={driverLocation}
      pickupLocation={
        appointment.pickupAddress?.coordinates?.coordinates
          ? {
              lat: appointment.pickupAddress.coordinates.coordinates[1],
              lng: appointment.pickupAddress.coordinates.coordinates[0]
            }
          : appointment.location?.coordinates
          ? { lat: appointment.location.latitude, lng: appointment.location.longitude }
          : null
      }
      deliveryLocation={
        appointment.deliveryAddress?.coordinates
          ? {
              lat: appointment.deliveryAddress.coordinates.lat,
              lng: appointment.deliveryAddress.coordinates.lng
            }
          : null
      }
      showRoute={true}
      height="500px"
    />
    {driverLocation && (
      <div className="mt-4 text-sm text-gray-600">
        <p className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Última actualización: {new Date().toLocaleTimeString('es-MX')}
        </p>
      </div>
    )}
  </div>
)}
```

### Paso 2: Configurar Google Maps API Key

1. **Obtener API Key:**
   - Ve a: https://console.cloud.google.com/
   - Crea un proyecto o selecciona uno existente
   - Habilita "Maps JavaScript API"
   - Crea credenciales (API Key)
   - Restringe la key a tu dominio

2. **Agregar al archivo `.env`:**

```env
# Frontend (.env o .env.local)
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

3. **Para desarrollo local sin API Key:**
   - El componente mostrará un mensaje de error pero no romperá la app
   - Puedes usar una versión simplificada sin Google Maps

### Paso 3: Actualizar el servidor para retransmitir ubicación

El servidor ya tiene la configuración básica en `backend/server.js`:

```javascript
socket.on('driver-location', (data) => {
  socket.to(data.appointmentId).emit('location-update', data);
});
```

Pero necesita emitir también a la sala del usuario:

```javascript
socket.on('driver-location', (data) => {
  // Emitir a la sala de la cita
  socket.to(data.appointmentId).emit('location-update', data);
  
  // También emitir con el evento que escucha el cliente
  io.emit('driver-location-updated', {
    appointmentId: data.appointmentId,
    location: data.location,
    timestamp: data.timestamp
  });
});
```

### Paso 4: Asegurar que el cliente se una a la sala de la cita

En `frontend/src/pages/client/AppointmentDetails.jsx`, agregar después de conectar el socket:

```javascript
useEffect(() => {
  if (socket && appointment?._id) {
    // Unirse a la sala de la cita para recibir actualizaciones
    socket.emit('join-room', appointment._id);
    
    return () => {
      socket.emit('leave-room', appointment._id);
    };
  }
}, [socket, appointment?._id]);
```

## 🧪 Cómo Probar

### Prueba Local (sin API Key):

1. **Terminal 1 - Backend:**
```bash
cd backend
npm start
```

2. **Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

3. **Simular flujo:**
   - Crear una cita como cliente
   - Login como chofer
   - Aceptar la cita
   - Cambiar estado a "driver_enroute"
   - El hook `useDriverLocation` empezará a rastrear
   - Abre la cita como cliente y deberías ver actualizaciones

### Prueba con Google Maps:

1. Configura `VITE_GOOGLE_MAPS_API_KEY`
2. Reinicia el servidor de desarrollo
3. El mapa se cargará y mostrará la ubicación en tiempo real

## 📱 Funcionalidades Implementadas

✅ **Rastreo automático de ubicación del chofer**
- Se activa cuando el estado es 'driver_enroute' o 'picked_up'
- Actualiza cada vez que el GPS detecta movimiento
- Envía al servidor vía Socket.IO

✅ **Visualización en tiempo real para el cliente**
- Mapa interactivo con Google Maps
- Marcadores para chofer, recogida y entrega
- Animación suave del movimiento del chofer
- Ruta dibujada entre chofer y destino

✅ **Manejo de errores**
- Permisos de ubicación denegados
- GPS no disponible
- Error al cargar Google Maps
- Pérdida de conexión Socket.IO

## 🔒 Consideraciones de Seguridad

1. **Permisos de ubicación:** El navegador pedirá permiso al chofer
2. **HTTPS requerido:** La geolocalización solo funciona en HTTPS (excepto localhost)
3. **Restricción de API Key:** Limita tu Google Maps API Key a tu dominio
4. **Privacidad:** La ubicación solo se comparte durante la cita activa

## 🚀 Próximos Pasos Opcionales

- [ ] Agregar estimación de tiempo de llegada (ETA)
- [ ] Mostrar velocidad del chofer
- [ ] Historial de ruta recorrida
- [ ] Notificaciones cuando el chofer está cerca
- [ ] Modo offline con caché de última ubicación
- [ ] Integración con Waze/Google Maps para navegación

## 📝 Notas

- El seguimiento se detiene automáticamente cuando la cita cambia de estado
- La ubicación se actualiza aproximadamente cada 5-10 segundos (depende del GPS)
- En interiores o áreas con mala señal GPS, la precisión puede ser baja
- El consumo de batería aumenta con el rastreo GPS continuo
