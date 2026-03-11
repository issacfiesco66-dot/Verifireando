# Estructura de Autenticación - Verifireando

## ✅ Estructura Correcta (Lo que DEBE haber)

### 1. **Registro Unificado** 
- **Ruta**: `/auth/register`
- **Componente**: `Register.jsx` (UN SOLO componente)
- **Funcionalidad**: 
  - Permite seleccionar rol: Cliente o Chofer
  - Si viene con `?role=driver`, pre-selecciona "Chofer"
  - Si viene con `?role=client` o sin query param, muestra selector
  - Campos adicionales de licencia solo aparecen si selecciona "Chofer"
  - Botón de Google Sign-In funciona para ambos roles

### 2. **Login Cliente**
- **Ruta**: `/auth/login`
- **Componente**: `Login.jsx`
- **Funcionalidad**:
  - Login con email/password (busca usuarios con `role='client'`)
  - Botón "Continuar con Google"
  - Link a registro general
  - Link a login de chofer

### 3. **Login Chofer**
- **Ruta**: `/auth/login/driver`
- **Componente**: `DriverLogin.jsx`
- **Funcionalidad**:
  - Login con email/password (busca usuarios con `role='driver'`)
  - Botón "Continuar con Google" (crea como driver si no existe)
  - Link a registro de chofer (`/auth/register?role=driver`)
  - Link a login de cliente

## 🔄 Flujos

### Registro Cliente:
1. Usuario va a `/auth/register`
2. Selecciona "Cliente" en el selector
3. Llena formulario (sin campos de licencia)
4. Envía → Backend crea usuario con `role='client'`
5. Redirige a verificación de email

### Registro Chofer:
1. Usuario va a `/auth/register?role=driver` o `/auth/register` y selecciona "Chofer"
2. Se muestran campos de licencia
3. Llena formulario completo
4. Envía → Backend crea usuario con `role='driver'` y `driverProfile`
5. Redirige a verificación de email

### Login Cliente:
1. Usuario va a `/auth/login`
2. Ingresa email/password o usa Google
3. Backend busca usuario con `role='client'`
4. Si está verificado → Redirige a `/client/dashboard`
5. Si no está verificado → Redirige a verificación

### Login Chofer:
1. Usuario va a `/auth/login/driver`
2. Ingresa email/password o usa Google
3. Backend busca usuario con `role='driver'` (o migra desde Driver legacy)
4. Si está verificado → Redirige a `/driver/dashboard`
5. Si no está verificado → Redirige a verificación

## 📋 Rutas en App.jsx

```jsx
<Route path="/auth" element={<PublicLayout />}>
  <Route path="login" element={<LoginPage />} />           // Login cliente
  <Route path="login/driver" element={<DriverLoginPage />} /> // Login chofer
  <Route path="register" element={<RegisterPage />} />     // Registro unificado
  ...
</Route>

// Redirects para compatibilidad
<Route path="/register" element={<RedirectWithQuery to="/auth/register" />} />
<Route path="/login" element={<RedirectWithQuery to="/auth/login" />} />
<Route path="/login/driver" element={<RedirectWithQuery to="/auth/login/driver" />} />
```

## ✅ Estado Actual

- ✅ UN componente Register.jsx que maneja ambos roles
- ✅ DOS componentes Login separados (Login.jsx y DriverLogin.jsx)
- ✅ Backend acepta registro con role='client' o role='driver'
- ✅ Google Sign-In funciona en ambos logins y registro
- ✅ Rutas correctas configuradas

## 🐛 Posibles Problemas

1. **Error 403 en raíz**: Problema de permisos de Nginx, no del código
2. **Registro no funciona**: Puede ser que los cambios no están desplegados
3. **Google Sign-In no funciona**: Verificar que Firebase está configurado
