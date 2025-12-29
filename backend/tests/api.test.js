const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Car = require('../models/Car');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

// Variables globales para tokens y IDs
let clientToken;
let driverToken;
let adminToken;
let clientId;
let driverId;
let carId;
let appointmentId;
let serviceId;

describe('Verifireando API - Pruebas de Endpoints', () => {
  
  beforeAll(async () => {
    // Conectar a base de datos de prueba
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Limpiar y cerrar conexión
    await mongoose.connection.close();
  });

  // ==================== HEALTH CHECK ====================
  describe('Health Check', () => {
    test('GET /health - Debe retornar status OK', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });

    test('GET /api/health - Debe retornar status OK', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'OK');
    });
  });

  // ==================== DIAGNOSTICS ====================
  describe('Diagnostics', () => {
    test('GET /api/diagnostics - Debe retornar información del sistema', async () => {
      const res = await request(app)
        .get('/api/diagnostics')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('firebase');
      expect(res.body).toHaveProperty('config');
    });
  });

  // ==================== AUTH - REGISTRO ====================
  describe('Auth - Registro', () => {
    test('POST /api/auth/register - Registrar cliente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Cliente Test',
          email: `client-${Date.now()}@test.com`,
          phone: '+525512345678',
          password: 'password123',
          role: 'client'
        })
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('userId');
      clientId = res.body.userId;
    });

    test('POST /api/auth/register - Registrar chofer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Chofer Test',
          email: `driver-${Date.now()}@test.com`,
          phone: '+525587654321',
          password: 'password123',
          role: 'driver',
          licenseNumber: 'LIC123456',
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          vehicleInfo: {
            brand: 'Toyota',
            model: 'Corolla',
            year: 2020,
            plates: 'ABC-123-D',
            color: 'Blanco'
          }
        })
        .expect(201);

      expect(res.body).toHaveProperty('userId');
      driverId = res.body.userId;
    });

    test('POST /api/auth/register - Debe fallar con datos inválidos', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'T',
          email: 'invalid-email',
          password: '123'
        })
        .expect(400);
    });
  });

  // ==================== AUTH - LOGIN ====================
  describe('Auth - Login', () => {
    test('POST /api/auth/login - Login como cliente', async () => {
      // Primero crear y verificar un usuario
      const email = `verified-client-${Date.now()}@test.com`;
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Cliente Verificado',
          email: email,
          phone: '+525511111111',
          password: 'password123',
          role: 'client'
        });

      // Verificar el usuario directamente en la BD
      await User.findByIdAndUpdate(registerRes.body.userId, { isVerified: true });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: email,
          password: 'password123',
          role: 'client'
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      clientToken = res.body.token;
    });

    test('POST /api/auth/login - Debe fallar con credenciales incorrectas', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'wrongpassword',
          role: 'client'
        })
        .expect(401);
    });
  });

  // ==================== AUTH - PERFIL ====================
  describe('Auth - Perfil', () => {
    test('GET /api/auth/profile - Obtener perfil autenticado', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('user');
    });

    test('GET /api/auth/profile - Debe fallar sin token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    test('PUT /api/auth/profile - Actualizar perfil', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Cliente Actualizado',
          phone: '+525599999999'
        })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });

  // ==================== SERVICES ====================
  describe('Services', () => {
    test('GET /api/services - Obtener todos los servicios', async () => {
      const res = await request(app)
        .get('/api/services')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/services?popular=true - Obtener servicios populares', async () => {
      const res = await request(app)
        .get('/api/services?popular=true&limit=5')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    test('GET /api/services/categories/list - Obtener categorías', async () => {
      const res = await request(app)
        .get('/api/services/categories/list')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ==================== CARS ====================
  describe('Cars', () => {
    test('POST /api/cars - Crear vehículo', async () => {
      const res = await request(app)
        .post('/api/cars')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          plates: `TST-${Date.now().toString().slice(-3)}-X`,
          brand: 'Honda',
          model: 'Civic',
          year: 2021,
          color: 'Negro',
          vin: `VIN${Date.now()}`
        })
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('car');
      carId = res.body.car._id;
    });

    test('GET /api/cars - Obtener mis vehículos', async () => {
      const res = await request(app)
        .get('/api/cars')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('cars');
      expect(Array.isArray(res.body.cars)).toBe(true);
    });

    test('GET /api/cars/:id - Obtener vehículo por ID', async () => {
      const res = await request(app)
        .get(`/api/cars/${carId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('car');
      expect(res.body.car._id).toBe(carId);
    });

    test('PUT /api/cars/:id - Actualizar vehículo', async () => {
      const res = await request(app)
        .put(`/api/cars/${carId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          color: 'Azul'
        })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body.car.color).toBe('Azul');
    });
  });

  // ==================== DRIVERS ====================
  describe('Drivers', () => {
    test('GET /api/drivers - Obtener choferes disponibles', async () => {
      const res = await request(app)
        .get('/api/drivers')
        .expect(200);

      expect(res.body).toHaveProperty('drivers');
      expect(Array.isArray(res.body.drivers)).toBe(true);
    });

    test('GET /api/drivers?search=test - Buscar choferes', async () => {
      const res = await request(app)
        .get('/api/drivers?search=test')
        .expect(200);

      expect(res.body).toHaveProperty('drivers');
    });
  });

  // ==================== APPOINTMENTS ====================
  describe('Appointments', () => {
    test('POST /api/appointments - Crear cita', async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 2);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          car: carId,
          scheduledDate: scheduledDate,
          scheduledTime: '10:00',
          services: {
            verification: true,
            additionalServices: []
          },
          pickupAddress: {
            street: 'Calle Test 123',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '01000',
            coordinates: {
              lat: 19.4326,
              lng: -99.1332
            }
          },
          deliveryAddress: {
            street: 'Calle Test 456',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '01000',
            coordinates: {
              lat: 19.4326,
              lng: -99.1332
            }
          },
          notes: 'Cita de prueba'
        })
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('appointment');
      appointmentId = res.body.appointment._id;
    });

    test('GET /api/appointments - Obtener mis citas', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('appointments');
      expect(Array.isArray(res.body.appointments)).toBe(true);
    });

    test('GET /api/appointments/my-appointments - Obtener mis citas (alias)', async () => {
      const res = await request(app)
        .get('/api/appointments/my-appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('appointments');
    });

    test('GET /api/appointments/:id - Obtener cita por ID', async () => {
      const res = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('appointment');
    });

    test('PUT /api/appointments/:id/cancel - Cancelar cita', async () => {
      const res = await request(app)
        .put(`/api/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'Prueba de cancelación'
        })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body.appointment.status).toBe('cancelled');
    });
  });

  // ==================== NOTIFICATIONS ====================
  describe('Notifications', () => {
    test('GET /api/notifications - Obtener notificaciones', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    test('GET /api/notifications/unread/count - Contar no leídas', async () => {
      const res = await request(app)
        .get('/api/notifications/unread/count')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('count');
      expect(typeof res.body.count).toBe('number');
    });
  });

  // ==================== USERS (Admin) ====================
  describe('Users (Admin)', () => {
    test('GET /api/users - Debe fallar sin permisos de admin', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  // ==================== ADMIN ====================
  describe('Admin', () => {
    test('GET /api/admin/dashboard/stats - Debe fallar sin permisos de admin', async () => {
      await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    test('GET /api/admin/settings - Debe fallar sin permisos de admin', async () => {
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  // ==================== PRUEBAS DE VALIDACIÓN ====================
  describe('Validaciones', () => {
    test('POST /api/cars - Debe fallar sin token', async () => {
      await request(app)
        .post('/api/cars')
        .send({
          plates: 'ABC-123-D',
          brand: 'Honda',
          model: 'Civic'
        })
        .expect(401);
    });

    test('POST /api/appointments - Debe fallar con datos inválidos', async () => {
      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          car: 'invalid-id',
          scheduledDate: 'invalid-date'
        })
        .expect(400);
    });

    test('PUT /api/cars/:id - Debe fallar con ID inválido', async () => {
      await request(app)
        .put('/api/cars/invalid-id')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          color: 'Rojo'
        })
        .expect(500);
    });
  });

  // ==================== PRUEBAS DE PAGINACIÓN ====================
  describe('Paginación', () => {
    test('GET /api/services?page=1&limit=5 - Paginación de servicios', async () => {
      const res = await request(app)
        .get('/api/services?page=1&limit=5')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    test('GET /api/appointments?page=1&limit=10 - Paginación de citas', async () => {
      const res = await request(app)
        .get('/api/appointments?page=1&limit=10')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 10);
    });
  });

  // ==================== PRUEBAS DE FILTROS ====================
  describe('Filtros', () => {
    test('GET /api/appointments?status=cancelled - Filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/appointments?status=cancelled')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('appointments');
    });

    test('GET /api/services?category=verificacion - Filtrar por categoría', async () => {
      const res = await request(app)
        .get('/api/services?category=verificacion')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });
  });

  // ==================== PRUEBAS DE ERRORES ====================
  describe('Manejo de Errores', () => {
    test('GET /api/ruta-inexistente - Debe retornar 404', async () => {
      await request(app)
        .get('/api/ruta-inexistente')
        .expect(404);
    });

    test('POST /api/auth/login - Token JWT inválido', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    test('GET /api/cars/:id - Vehículo no encontrado', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/cars/${fakeId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });
});
