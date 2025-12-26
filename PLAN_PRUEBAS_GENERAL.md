# Plan de Pruebas General - Verifireando

## 📋 Resumen del Proyecto
- **Proyecto**: Plataforma de verificación vehicular
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + MongoDB
- **Autenticación**: Firebase + JWT

## 🎯 Objetivo
Realizar pruebas exhaustivas de todos los botones y elementos interactivos del sistema, comenzando desde el registro/login hasta todas las funcionalidades de cada rol.

---

## 🔑 1. Pruebas de Autenticación

### 1.1 Página de Login (`/auth/login`)
- [ ] **Botón "Iniciar sesión"**
  - Validar campos vacíos
  - Validar formato de email inválido
  - Validar contraseña menor a 6 caracteres
  - Probar login con credenciales correctas (cliente, chofer, admin)
  - Verificar redirección según rol
- [ ] **Botón "Mostrar/Ocultar contraseña"** (ojo)
  - Alternar visibilidad de la contraseña
- [ ] **Selector de tipo de cuenta**
  - Probar cada opción: Cliente, Chofer, Administrador
- [ ] **Checkbox "Recordarme"**
  - Verificar que mantiene la sesión
- [ ] **Link "¿Olvidaste tu contraseña?"**
  - Redirige a `/auth/forgot-password`
- [ ] **Botón "Continuar con Google"**
  - Probar autenticación con Google
- [ ] **Link "Crear cuenta nueva"**
  - Redirige a `/auth/register`

### 1.2 Página de Registro (`/auth/register`)
- [ ] **Botón "Crear cuenta"**
  - Validar todos los campos requeridos
  - Validar formato de email
  - Validar teléfono (10 dígitos)
  - Validar contraseña (mayúscula, minúscula, número)
  - Validar confirmación de contraseña
  - Probar registro exitoso para cada rol
- [ ] **Botones "Mostrar/Ocultar contraseña"**
  - Funcionalidad para ambos campos de contraseña
- [ ] **Botón "Continuar con Google"**
  - Probar registro/login con Google
- [ ] **Link "Inicia sesión aquí"**
  - Redirige a `/auth/login`

### 1.3 Recuperación de Contraseña
- [ ] **Página Forgot Password**
  - Enviar email de recuperación
  - Validar formato de email
- [ ] **Página Reset Password**
  - Ingresar nueva contraseña
  - Confirmar nueva contraseña
  - Validar requisitos de contraseña

### 1.4 Verificación de Email
- [ ] **Página Verify Email**
  - Ingresar código de verificación
  - Reenviar código
  - Verificar email exitoso

---

## 🌐 2. Pruebas de Páginas Públicas

### 2.1 Home Page (`/`)
- [ ] **Botón "Iniciar sesión"** en navbar
- [ ] **Botón "Registrarse"** en navbar
- [ ] **Botones CTA** en hero section
- [ ] **Cards de servicios** - verificar navegación
- [ ] **Links del footer** - todos funcionales

### 2.2 Página de Servicios (`/services`)
- [ ] **Cards de servicios** - interactividad
- [ ] **Botones de "Más información"**
- [ ] **Filtros de servicios** (si existen)

### 2.3 Página de Precios (`/pricing`)
- [ ] **Cards de planes** - selección
- [ ] **Botones "Seleccionar plan"**
- [ ] **Toggle mensual/anual** (si existe)

### 2.4 Contacto (`/contact`)
- [ ] **Formulario de contacto**
  - Validación de campos
  - Envío exitoso
- [ ] **Botones de redes sociales**

---

## 👤 3. Pruebas - Rol Cliente

### 3.1 Dashboard Cliente (`/client/dashboard`)
- [ ] **Navegación lateral** - todos los enlaces
- [ ] **Botón "Nueva cita"**
- [ ] **Botón "Agregar vehículo"**
- [ ] **Cards de resumen** - interactividad
- [ ] **Notificaciones** - abrir/cerrar

### 3.2 Vehículos (`/client/cars`)
- [ ] **Botón "Agregar nuevo vehículo"**
- [ ] **Cards de vehículos**
  - Botón "Editar"
  - Botón "Eliminar"
  - Ver detalles
- [ ] **Paginación** (si existe)

### 3.3 Nuevo Vehículo (`/client/cars/new`)
- [ ] **Formulario**
  - Validación de todos los campos
  - Subida de imágenes
- [ ] **Botón "Guardar vehículo"**
- [ ] **Botón "Cancelar"**

### 3.4 Citas (`/client/appointments`)
- [ ] **Filtros de citas** (estado, fecha)
- [ ] **Cards de citas**
  - Botón "Ver detalles"
  - Botón "Cancelar cita"
  - Botón "Reprogramar"
- [ ] **Botón "Nueva cita"**

### 3.5 Nueva Cita (`/client/appointments/new`)
- [ ] **Selección de vehículo**
- [ ] **Selección de servicio**
- [ ] **Calendario de fechas**
- [ ] **Selección de hora**
- [ ] **Botón "Confirmar cita"**
- [ ] **Botón "Pagar ahora"** (si aplica)

### 3.6 Detalles de Cita (`/client/appointments/:id`)
- [ ] **Información de la cita**
- [ ] **Botón "Cancelar"**
- [ ] **Botón "Reprogramar"**
- [ ] **Botón "Ver recibo"** (si aplica)
- [ ] **Mapa de ubicación** (interactivo)

### 3.7 Pagos (`/client/payments`)
- [ ] **Historial de pagos**
- [ ] **Botón "Pagar ahora"**
- [ ] **Botón "Descargar recibo"**
- [ ] **Métodos de pago**
  - Agregar nueva tarjeta
  - Eliminar tarjeta

### 3.8 Perfil (`/client/profile`)
- [ ] **Formulario de perfil**
  - Editar información
  - Subir foto
- [ ] **Botón "Guardar cambios"**
- [ ] **Cambiar contraseña**
- [ ] **Configuración de notificaciones**

### 3.9 Configuración (`/client/settings`)
- [ ] **Preferencias de cuenta**
- [ ] **Configuración de notificaciones**
- [ ] **Privacidad y seguridad**
- [ ] **Botón "Cerrar sesión"**
- [ ] **Botón "Eliminar cuenta"**

---

## 🚗 4. Pruebas - Rol Chofer

### 4.1 Dashboard Chofer (`/driver/dashboard`)
- [ ] **Navegación lateral**
- [ ] **Panel de hoy**
  - Botón "Iniciar ruta"
  - Botón "Completar servicio"
- [ ] **Lista de citas**
- [ ] **Mapa interactivo**

### 4.2 Citas Chofer (`/driver/appointments`)
- [ ] **Filtros (estado, fecha)**
- [ ] **Cards de citas**
  - Botón "Iniciar"
  - Botón "Navegar" (maps)
  - Botón "Completar"
  - Botón "Reportar problema"

### 4.3 Gestión de Citas (`/driver/manage-appointments`)
- [ ] **Calendario de vista**
- [ ] **Drag & drop** para reprogramar
- [ ] **Botones de acción rápida**

### 4.4 Mapa (`/driver/map`)
- [ ] **Controles del mapa**
  - Zoom in/out
  - Vista satélite/calles
  - Mi ubicación
- [ ] **Markers de citas**
- [ ] **Navegación turn-by-turn**

### 4.5 Ganancias (`/driver/earnings`)
- [ ] **Período de tiempo**
- [ ] **Resumen de ganancias**
- [ ] **Botón "Retirar fondos"**
- [ ] **Historial detallado**

### 4.6 Perfil Chofer (`/driver/profile`)
- [ ] **Información personal**
- [ ] **Documentación**
  - Subir licencia
  - Subir documentos
- [ ] **Estado de verificación**
- [ ] **Botón "Guardar cambios"**

### 4.7 Configuración Chofer (`/driver/settings`)
- [ ] **Disponibilidad**
  - Toggle online/offline
  - Horarios de trabajo
- [ ] **Preferencias de navegación**
- [ ] **Notificaciones push**
- [ ] **Botón "Cerrar sesión"**

---

## 📊 5. Pruebas - Rol Administrador

### 5.1 Dashboard Admin (`/admin/dashboard`)
- [ ] **Widgets de estadísticas**
- [ ] **Gráficos interactivos**
- [ ] **Exportar reportes**
- [ ] **Filtros de fecha**

### 5.2 Usuarios (`/admin/users`)
- [ ] **Tabla de usuarios**
  - Ordenar columnas
  - Buscar/ filtrar
- [ ] **Botón "Agregar usuario"**
- [ ] **Acciones por usuario**
  - Editar
  - Suspender
  - Eliminar
  - Resetear contraseña
- [ ] **Paginación**
- [ ] **Exportar a CSV/Excel**

### 5.3 Choferes (`/admin/drivers`)
- [ ] **Lista de choferes**
- [ ] **Botón "Aprobar chofer"**
- [ ] **Ver documentación**
- [ ] **Asignar vehículos**
- [ ] **Historial de servicios**

### 5.4 Vehículos (`/admin/cars`)
- [ ] **Inventario de vehículos**
- [ ] **Botón "Agregar vehículo"**
- [ ] **Editar información**
- [ ] **Cambiar estado**
- [ ] **Historial de mantenimiento**

### 5.5 Citas Admin (`/admin/appointments`)
- [ ] **Vista calendario**
- [ ] **Lista detallada**
- [ ] **Reasignar chofer**
- [ ] **Cancelar citas**
- [ ] **Exportar agenda**

### 5.6 Pagos (`/admin/payments`)
- [ ] **Transacciones pendientes**
- [ ] **Procesar reembolsos**
- [ ] **Conciliación de pagos**
- [ ] **Reportes financieros**

### 5.7 Reportes (`/admin/reports`)
- [ ] **Generar reportes**
  - Por período
  - Por servicio
  - Por chofer
- [ ] **Exportar PDF/Excel**
- [ ] **Gráficos dinámicos**
- [ ] **Filtros avanzados**

### 5.8 Configuración Admin (`/admin/settings`)
- [ ] **Configuración del sistema**
- [ ] **Gestión de tarifas**
- [ ] **Integraciones**
- [ ] **Logs del sistema**
- [ ] **Backup/Restore**

---

## 🔄 6. Flujos Críticos End-to-End

### 6.1 Flujo Cliente Nuevo
1. Registro → Verificación email → Login
2. Agregar vehículo → Crear cita → Pagar
3. Ver detalles → Cancelar cita → Reagendar

### 6.2 Flujo Chofer
1. Login → Ver agenda → Iniciar ruta
2. Navegar a cliente → Completar servicio
3. Reportar incidencia → Ver ganancias

### 6.3 Flujo Admin
1. Login → Ver dashboard → Aprobar chofer
2. Generar reporte → Procesar pagos
3. Configurar sistema → Ver logs

---

## 📱 7. Pruebas de Responsividad

### 7.1 Dispositivos
- [ ] **Móvil (320px - 768px)**
  - Menú hamburguesa
  - Touch targets > 44px
  - Scroll horizontal none
- [ ] **Tablet (768px - 1024px)**
  - Layout adaptativo
  - Navegación optimizada
- [ ] **Desktop (>1024px)**
  - Hover states
  - Atajos de teclado
  - Tooltips

### 7.2 Orientación
- [ ] **Retrato (mobile)**
- [ ] **Paisaje (mobile/tablet)**

---

## ♿ 8. Pruebas de Accesibilidad

### 8.1 Navegación por Teclado
- [ ] Tab order lógico
- [ ] Skip links
- [ ] Focus visible
- [ ] Escape cierra modales

### 8.2 Screen Reader
- [ ] Alt text en imágenes
- [ ] ARIA labels
- [ ] Anuncios de estado
- [ ] Estructura semántica

### 8.3 Contraste y Legibilidad
- [ ] WCAG AA compliance
- [ ] Texto escalable 200%
- [ ] Videos con subtítulos

---

## 🔧 9. Pruebas de Funcionalidades Especiales

### 9.1 PWA Features
- [ ] Install prompt
- [ ] Offline mode
- [ ] Push notifications
- [ ] Splash screen

### 9.2 Integraciones
- [ ] Google Maps API
- [ ] Google Auth
- [ ] Pasarela de pago
- [ ] Email service

### 9.3 Real-time Features
- [ ] Socket.io connection
- [ ] Live updates
- [ ] Notifications

---

## ✅ 10. Checklist de Validación

### Antes de finalizar pruebas:
- [ ] Todos los botones tienen hover/active states
- [ ] Los formularios validan correctamente
- [ ] Los errores muestran mensajes claros
- [ ] Los loads/spinners funcionan
- [ ] Las redirecciones son correctas
- [ ] El estado se mantiene al recargar
- [ ] Los datos se guardan correctamente
- [ ] Las notificaciones llegan
- [ ] Los emails se envían
- [ ] Los pagos se procesan

---

## 📝 Notas Adicionales

### Cuentas de Prueba
- Cliente: cliente@test.com / 123456
- Chofer: chofer@test.com / 123456
- Admin: admin@test.com / 123456

### URLs Base
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

### Comandos Útiles
```bash
# Iniciar todo
npm run dev

# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:frontend

# Build para producción
npm run build:all
```

### Herramientas Sugeridas
- Chrome DevTools para responsive
- Lighthouse para performance
- WAVE para accesibilidad
- Postman para API testing

---

## 🚀 Ejecución de Pruebas

1. **Preparar el ambiente**
   - Limpiar cache y cookies
   - Abrir en ventana incógnito
   - Tener las 3 cuentas de prueba listas

2. **Seguir el orden**
   - Empezar por autenticación
   - Probar cada rol secuencialmente
   - Documentar errores con screenshots

3. **Reportar issues**
   - Descripción clara
   - Pasos para reproducir
   - Expected vs Actual
   - Browser/device usado

¡Listo para comenzar las pruebas! 🎯
