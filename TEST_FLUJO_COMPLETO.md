# Test del Flujo Completo - Verifireando

## ✅ Checklist de Verificación

### **Paso 1: Crear Cita (Cliente)**
- [ ] Cliente puede crear una cita
- [ ] Cita se crea con estado `pending`
- [ ] Campo `driver` es `null`
- [ ] Se guardan correctamente `pickupAddress` y `deliveryAddress`
- [ ] No hay error 500 al crear

**Cómo verificar:**
```bash
# En el backend, ver logs:
pm2 logs verifireando-backend --lines 50 | grep -i "cita creada"

# Verificar en base de datos:
# Debe tener: status: 'pending', driver: null
```

### **Paso 2: Chofer Se Conecta**
- [ ] Chofer hace clic en "Conectar"
- [ ] Estado se sincroniza con backend (`PUT /api/drivers/me/online-status`)
- [ ] Backend actualiza `isOnline: true` en modelo Driver
- [ ] Sección "Citas Disponibles" aparece en Dashboard

**Cómo verificar:**
```bash
# En backend, verificar que se actualizó:
# Buscar en logs: "Chofer conectado"

# Verificar endpoint:
curl -X PUT http://localhost:5000/api/drivers/me/online-status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"isOnline": true}'
```

### **Paso 3: Chofer Ve Citas Disponibles**
- [ ] Endpoint `/api/appointments/driver/available` responde correctamente
- [ ] Devuelve citas con `status: 'pending'` y `driver: null`
- [ ] Frontend muestra la sección "Citas Disponibles"
- [ ] Muestra información: cliente, dirección, distancia, monto

**Cómo verificar:**
```bash
# En frontend, abrir consola y ver:
# Debe llamar a: GET /api/appointments/driver/available
# Debe devolver: { appointments: [...] }

# En backend:
curl http://localhost:5000/api/appointments/driver/available \
  -H "Authorization: Bearer <DRIVER_TOKEN>"
```

### **Paso 4: Chofer Acepta Cita**
- [ ] Chofer hace clic en "Aceptar"
- [ ] Endpoint `PUT /api/appointments/:id/accept` se llama correctamente
- [ ] Estado cambia a `assigned`
- [ ] Se genera `pickupCode` (6 dígitos)
- [ ] Chofer se marca como `isAvailable: false`
- [ ] Cita desaparece de "Disponibles" y aparece en "Asignadas"

**Cómo verificar:**
```bash
# En backend, ver logs:
pm2 logs verifireando-backend --lines 50 | grep -i "aceptada"

# Verificar en base de datos:
# appointment.status debe ser 'assigned'
# appointment.driver debe tener el ID del chofer
# appointment.pickupCode debe existir (6 dígitos)
```

### **Paso 5: Chofer Ve Código**
- [ ] En detalles de cita, código se muestra grande arriba
- [ ] Visible cuando estado es `assigned` o `driver_enroute`
- [ ] Botón para copiar código funciona

**Cómo verificar:**
- Ir a `/driver/appointments/:id`
- Debe ver código grande arriba de todo

### **Paso 6: Cliente Ve Información del Chofer**
- [ ] Cliente puede ver detalles del chofer asignado
- [ ] Cliente ve su código de verificación
- [ ] Cliente puede ingresar código del chofer

**Cómo verificar:**
- Ir a `/client/appointments/:id`
- Debe ver información del chofer
- Debe ver código de verificación

### **Paso 7: Cliente Verifica Código**
- [ ] Cliente ingresa código del chofer
- [ ] Endpoint `POST /api/appointments/:id/verify-pickup-code` funciona
- [ ] Si código es correcto, estado cambia a `picked_up`
- [ ] Si código es incorrecto, muestra error

**Cómo verificar:**
```bash
# En backend:
curl -X POST http://localhost:5000/api/appointments/:id/verify-pickup-code \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

### **Paso 8: Chofer Avanza Estados**
- [ ] `assigned` → "Iniciar viaje" → `driver_enroute`
- [ ] `driver_enroute` → "Vehículo recogido" → `picked_up`
- [ ] `picked_up` → "Iniciar verificación" → `in_verification`
- [ ] `in_verification` → "Completar verificación" → `completed`
- [ ] `completed` → "Entregar vehículo" → `delivered`

**Cómo verificar:**
- En detalles de cita del chofer
- Deben aparecer botones según el estado actual

## 🔍 Verificar Errores Específicos

### Error 500 al Crear Cita
```bash
# Ver logs detallados:
pm2 logs verifireando-backend --lines 100 | grep -i "error creando cita"

# Verificar:
1. ¿Coordenadas están en formato correcto? (lng, lat como números)
2. ¿Pricing existe antes de calcular?
3. ¿Hay error de validación de Mongoose?
```

### Error 409 (Conflict)
- Significa que ya existe una cita pendiente para ese vehículo
- Mensaje debe mostrar: "Ya tienes una cita pendiente para este vehículo. Cita #..."
- Verificar si hay citas activas del mismo vehículo

### Chofer No Ve Citas Disponibles
```bash
# Verificar:
1. ¿Chofer está en línea? (isOnline: true en backend)
2. ¿Endpoint /driver/available funciona?
3. ¿Hay citas con status: 'pending' y driver: null?
4. ¿Frontend muestra errores en consola?
```

## 🐛 Logs a Revisar

```bash
# Backend - Ver todos los errores:
pm2 logs verifireando-backend --lines 200 | grep -i error

# Backend - Ver creación de citas:
pm2 logs verifireando-backend --lines 200 | grep -i "cita"

# Backend - Ver aceptación de citas:
pm2 logs verifireando-backend --lines 200 | grep -i "acept"

# Frontend - Ver errores en consola del navegador:
# Abrir DevTools > Console y buscar errores rojos
```

## 📝 Comandos de Verificación en Servidor

```bash
cd /home/ubuntu/Verifireando

# 1. Ver logs del backend
pm2 logs verifireando-backend --lines 100

# 2. Verificar que el backend esté corriendo
pm2 status

# 3. Verificar endpoints manualmente
curl http://localhost:5000/api/health

# 4. Verificar base de datos (si tienes acceso)
# Ver últimas citas creadas:
# db.appointments.find().sort({createdAt: -1}).limit(5)

# 5. Verificar última cita creada:
# db.appointments.findOne({}, {}, {sort: {createdAt: -1}})
```

## ✅ Qué Esperar

1. **Cliente crea cita** → Sin errores, cita creada con `pending`
2. **Chofer conecta** → Sin errores, estado sincronizado
3. **Chofer ve disponibles** → Lista de citas `pending` sin chofer
4. **Chofer acepta** → Sin errores, código generado, estado `assigned`
5. **Chofer ve código** → Código visible arriba de detalles
6. **Cliente verifica** → Sin errores, estado avanza correctamente

## 🚨 Si Algo Falla

1. **Revisar logs del backend** - Buscar el error exacto
2. **Revisar consola del navegador** - Ver errores de frontend
3. **Verificar base de datos** - Confirmar que los datos se guardan
4. **Verificar endpoints** - Usar `curl` para probar manualmente
5. **Compartir logs específicos** - El error exacto con stack trace
