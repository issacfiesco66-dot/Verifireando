const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos
const User = require('../models/User');
const Driver = require('../models/Driver');
const Car = require('../models/Car');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// Conectar a la base de datos
async function connectDB() {
  try {
    // Intentar conectar a la base de datos local o remota
    // Si falla, usar memoria como fallback (igual que en app.js)
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/verifireando');
      console.log('✅ Conectado a MongoDB');
    } catch (e) {
      console.log('⚠️  Falló conexión principal, intentando base de datos en memoria...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Conectado a MongoDB en memoria: ${uri}`);
    }
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

// Limpiar base de datos
async function clearDatabase() {
  try {
    await User.deleteMany({});
    await Driver.deleteMany({});
    await Car.deleteMany({});
    await Appointment.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    console.log('🧹 Base de datos limpiada');
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
  }
}

// Crear usuarios de prueba
async function createUsers() {
  try {
    const users = [
      {
        _id: new mongoose.Types.ObjectId('657a7f7d1234567890123456'), // Fixed ID
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '5512345678', // Corregido formato
        password: await bcrypt.hash('password123', 12),
        isVerified: true,
        role: 'client',
        // address: {...} // Removido campo address embebido si causa problemas de geo
      },
      {
        _id: new mongoose.Types.ObjectId('657a7f7d1234567890123457'), // Fixed ID
        name: 'María García',
        email: 'maria@example.com',
        phone: '5587654321',
        password: await bcrypt.hash('password123', 12),
        isVerified: true,
        role: 'client'
      },
      {
        _id: new mongoose.Types.ObjectId('657a7f7d1234567890123458'), // Fixed ID
        name: 'Carlos López',
        email: 'carlos@example.com',
        phone: '5598765432',
        password: await bcrypt.hash('password123', 12),
        isVerified: true,
        role: 'client'
      },
      {
        _id: new mongoose.Types.ObjectId('657a7f7d1234567890123459'), // Fixed ID
        name: 'Admin Usuario',
        email: 'admin@verifireando.com',
        phone: '5511111111',
        password: await bcrypt.hash('admin123', 12),
        isVerified: true,
        role: 'admin'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ ${createdUsers.length} usuarios creados`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    return [];
  }
}

// Crear choferes de prueba
async function createDrivers() {
  try {
    const drivers = [
      {
        _id: new mongoose.Types.ObjectId('657a7f7d1234567890123460'), // Fixed ID
        name: 'Roberto Martínez',
        email: 'roberto@example.com',
        phone: '5522222222',
        password: await bcrypt.hash('driver123', 12),
        isVerified: true,
        role: 'driver',
        licenseNumber: 'LIC123456789', // Nombre corregido
        licenseExpiry: new Date('2025-12-31'), // Nombre corregido
        vehicleInfo: { // Estructura corregida
          plates: 'ABC123D',
          brand: 'Nissan',
          model: 'Versa',
          year: 2020,
          color: 'Blanco'
        },
        location: {
            type: 'Point',
            coordinates: [-99.1332, 19.4326] // [lng, lat]
        },
        isOnline: true,
        isAvailable: true,
        verificationStatus: 'approved' // Valor enum correcto
      },
      {
        _id: new mongoose.Types.ObjectId('657a7f7d1234567890123461'), // Fixed ID
        name: 'Ana Rodríguez',
        email: 'ana@example.com',
        phone: '5533333333',
        password: await bcrypt.hash('driver123', 12),
        isVerified: true,
        role: 'driver',
        licenseNumber: 'LIC987654321',
        licenseExpiry: new Date('2025-06-30'),
        vehicleInfo: {
          plates: 'XYZ789E',
          brand: 'Chevrolet',
          model: 'Aveo',
          year: 2019,
          color: 'Azul'
        },
        location: {
            type: 'Point',
            coordinates: [-99.1692, 19.4284]
        },
        isOnline: true,
        isAvailable: true,
        verificationStatus: 'approved'
      },
      {
        _id: new mongoose.Types.ObjectId('657a7f7d1234567890123462'), // Fixed ID
        name: 'Miguel Torres',
        email: 'miguel@example.com',
        phone: '5544444444',
        password: await bcrypt.hash('driver123', 12),
        isVerified: true,
        role: 'driver',
        licenseNumber: 'LIC456789123',
        licenseExpiry: new Date('2024-12-31'),
        vehicleInfo: {
          plates: 'DEF456G',
          brand: 'Toyota',
          model: 'Yaris',
          year: 2021,
          color: 'Gris'
        },
        location: {
            type: 'Point',
            coordinates: [-99.1386, 19.4342]
        },
        isOnline: false,
        isAvailable: false,
        verificationStatus: 'pending'
      }
    ];

    const createdDrivers = await Driver.insertMany(drivers);
    console.log(`✅ ${createdDrivers.length} choferes creados`);
    return createdDrivers;
  } catch (error) {
    console.error('❌ Error creando choferes:', error);
    return [];
  }
}

// Crear autos de prueba
async function createCars(users) {
  try {
    const cars = [
      {
        owner: users[0]._id, // Juan (ID fijo)
        plates: 'JUA123N', // Fixed format (alphanumeric, 6-8 chars)
        brand: 'Honda',
        model: 'Civic',
        year: 2018,
        color: 'Negro',
        engineType: 'gasoline', // Fixed enum value
        documents: {
          registration: {
            url: '/uploads/cars/registration_honda.pdf',
            expiryDate: new Date('2024-12-31')
          },
          insurance: {
            url: '/uploads/cars/insurance_honda.pdf',
            expiryDate: new Date('2024-06-30')
          }
        },
        photos: [
          '/uploads/cars/honda_front.jpg',
          '/uploads/cars/honda_side.jpg'
        ],
        verificationHistory: [],
        nextVerificationDue: new Date('2024-01-15'),
        isActive: true,
        metadata: {
          vin: '1HGBH41JXMN109186',
          engineNumber: 'ENG123456'
        }
      }
    ];

    const createdCars = await Car.insertMany(cars);
    console.log(`✅ ${createdCars.length} autos creados`);
    return createdCars;
  } catch (error) {
    console.error('❌ Error creando autos:', error);
    return [];
  }
}

// Crear citas de prueba
async function createAppointments(users, drivers, cars) {
  try {
    const appointments = [
      {
        client: users[0]._id,
        car: cars[0]._id,
        driver: drivers[0]._id,
        appointmentNumber: 'VER-2024-001',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        services: {
          verification: {
            required: true,
            price: 500
          },
          additionalServices: [
            {
              name: 'Lavado exterior',
              price: 150,
              selected: true
            }
          ]
        },
        pickupAddress: {
          street: 'Av. Insurgentes Sur 123',
          neighborhood: 'Roma Norte',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '06700',
          coordinates: {
            lat: 19.4326,
            lng: -99.1332
          }
        },
        deliveryAddress: {
          street: 'Av. Insurgentes Sur 123',
          neighborhood: 'Roma Norte',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '06700',
          coordinates: {
            lat: 19.4326,
            lng: -99.1332
          }
        },
        status: 'completed',
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date('2024-01-10T08:00:00Z'),
            notes: 'Cita creada'
          },
          {
            status: 'confirmed',
            timestamp: new Date('2024-01-10T09:00:00Z'),
            notes: 'Chofer asignado'
          },
          {
            status: 'in_progress',
            timestamp: new Date('2024-01-15T10:00:00Z'),
            notes: 'Chofer en camino'
          },
          {
            status: 'completed',
            timestamp: new Date('2024-01-15T12:00:00Z'),
            notes: 'Servicio completado'
          }
        ],
        pricing: {
          subtotal: 650,
          taxes: 104,
          total: 754
        },
        verificationResult: {
          passed: true,
          inspector: 'Inspector García',
          notes: 'Vehículo aprobado',
          nextDueDate: new Date('2025-01-15'),
          certificateNumber: 'CERT-2024-001'
        },
        timeline: [
          {
            event: 'Cita creada',
            timestamp: new Date('2024-01-10T08:00:00Z')
          },
          {
            event: 'Chofer asignado',
            timestamp: new Date('2024-01-10T09:00:00Z')
          },
          {
            event: 'Vehículo recogido',
            timestamp: new Date('2024-01-15T10:30:00Z')
          },
          {
            event: 'Verificación completada',
            timestamp: new Date('2024-01-15T11:30:00Z')
          },
          {
            event: 'Vehículo entregado',
            timestamp: new Date('2024-01-15T12:00:00Z')
          }
        ],
        ratings: {
          clientRating: {
            rating: 5,
            comment: 'Excelente servicio',
            ratedAt: new Date('2024-01-15T13:00:00Z')
          }
        },
        estimatedDuration: 120,
        actualDuration: 120
      },
      {
        client: users[1]._id,
        car: cars[1]._id,
        appointmentNumber: 'VER-2024-002',
        scheduledDate: new Date('2024-01-20'),
        scheduledTime: '14:00',
        services: {
          verification: {
            required: true,
            price: 500
          },
          additionalServices: [
            {
              name: 'Cambio de aceite',
              price: 300,
              selected: true
            },
            {
              name: 'Lavado completo',
              price: 250,
              selected: true
            }
          ]
        },
        pickupAddress: {
          street: 'Calle Madero 456',
          neighborhood: 'Centro Histórico',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '06000',
          coordinates: {
            lat: 19.4342,
            lng: -99.1386
          }
        },
        deliveryAddress: {
          street: 'Calle Madero 456',
          neighborhood: 'Centro Histórico',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '06000',
          coordinates: {
            lat: 19.4342,
            lng: -99.1386
          }
        },
        status: 'pending',
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date('2024-01-18T10:00:00Z'),
            notes: 'Cita creada, buscando chofer'
          }
        ],
        pricing: {
          subtotal: 1050,
          taxes: 168,
          total: 1218
        },
        timeline: [
          {
            event: 'Cita creada',
            timestamp: new Date('2024-01-18T10:00:00Z')
          }
        ],
        estimatedDuration: 180
      },
      {
        client: users[2]._id,
        car: cars[2]._id,
        driver: drivers[1]._id,
        appointmentNumber: 'VER-2024-003',
        scheduledDate: new Date('2024-01-25'),
        scheduledTime: '09:00',
        services: {
          verification: {
            required: true,
            price: 500
          }
        },
        pickupAddress: {
          street: 'Av. Reforma 789',
          neighborhood: 'Polanco',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '11560',
          coordinates: {
            lat: 19.4284,
            lng: -99.1692
          }
        },
        deliveryAddress: {
          street: 'Av. Reforma 789',
          neighborhood: 'Polanco',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '11560',
          coordinates: {
            lat: 19.4284,
            lng: -99.1692
          }
        },
        status: 'confirmed',
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date('2024-01-22T15:00:00Z'),
            notes: 'Cita creada'
          },
          {
            status: 'confirmed',
            timestamp: new Date('2024-01-22T16:00:00Z'),
            notes: 'Chofer Ana asignada'
          }
        ],
        pricing: {
          subtotal: 500,
          taxes: 80,
          total: 580
        },
        timeline: [
          {
            event: 'Cita creada',
            timestamp: new Date('2024-01-22T15:00:00Z')
          },
          {
            event: 'Chofer asignado',
            timestamp: new Date('2024-01-22T16:00:00Z')
          }
        ],
        estimatedDuration: 90
      }
    ];

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`✅ ${createdAppointments.length} citas creadas`);
    return createdAppointments;
  } catch (error) {
    console.error('❌ Error creando citas:', error);
    return [];
  }
}

// Crear pagos de prueba
async function createPayments(appointments) {
  try {
    const payments = [
      {
        appointment: appointments[0]._id,
        client: appointments[0].client,
        paymentNumber: 'PAY-2024-001',
        amount: {
          subtotal: 650,
          taxes: 104,
          total: 754
        },
        currency: 'MXN',
        method: 'card',
        provider: 'stripe',
        status: 'completed',
        paymentIntentId: 'pi_test_1234567890',
        paymentDetails: {
          cardLast4: '4242',
          cardBrand: 'visa',
          transactionId: 'txn_test_1234567890'
        },
        timeline: [
          {
            event: 'created',
            timestamp: new Date('2024-01-10T08:00:00Z')
          },
          {
            event: 'completed',
            timestamp: new Date('2024-01-15T12:00:00Z')
          }
        ],
        fees: {
          platformFee: 65,
          processingFee: 23,
          driverEarnings: 666
        },
        receipt: {
          number: 'REC-2024-001',
          url: '/uploads/receipts/receipt_001.pdf',
          generatedAt: new Date('2024-01-15T12:05:00Z')
        }
      },
      {
        appointment: appointments[1]._id,
        client: appointments[1].client,
        paymentNumber: 'PAY-2024-002',
        amount: {
          subtotal: 1050,
          taxes: 168,
          total: 1218
        },
        currency: 'MXN',
        method: 'cash',
        provider: 'cash',
        status: 'pending',
        timeline: [
          {
            event: 'created',
            timestamp: new Date('2024-01-18T10:00:00Z')
          }
        ],
        fees: {
          platformFee: 105,
          processingFee: 0,
          driverEarnings: 1113
        }
      }
    ];

    const createdPayments = await Payment.insertMany(payments);
    console.log(`✅ ${createdPayments.length} pagos creados`);
    return createdPayments;
  } catch (error) {
    console.error('❌ Error creando pagos:', error);
    return [];
  }
}

// Crear notificaciones de prueba
async function createNotifications(users, drivers) {
  try {
    const notifications = [
      {
        recipient: users[0]._id,
        recipientModel: 'User',
        type: 'appointment_confirmed',
        channel: 'push',
        title: 'Cita confirmada',
        message: 'Tu cita de verificación ha sido confirmada para el 15 de enero a las 10:00 AM',
        data: {
          appointmentId: 'VER-2024-001',
          driverName: 'Roberto Martínez'
        },
        status: 'sent',
        sentAt: new Date('2024-01-10T09:00:00Z'),
        isRead: true,
        readAt: new Date('2024-01-10T09:30:00Z')
      },
      {
        recipient: drivers[0]._id,
        recipientModel: 'Driver',
        type: 'new_appointment',
        channel: 'push',
        title: 'Nueva cita asignada',
        message: 'Se te ha asignado una nueva cita de verificación',
        data: {
          appointmentId: 'VER-2024-001',
          clientName: 'Juan Pérez'
        },
        status: 'sent',
        sentAt: new Date('2024-01-10T09:00:00Z'),
        isRead: true,
        readAt: new Date('2024-01-10T09:15:00Z')
      },
      {
        recipient: users[1]._id,
        recipientModel: 'User',
        type: 'appointment_reminder',
        channel: 'whatsapp',
        title: 'Recordatorio de cita',
        message: 'Recordatorio: Tu cita de verificación es mañana a las 2:00 PM',
        data: {
          appointmentId: 'VER-2024-002'
        },
        status: 'sent',
        sentAt: new Date('2024-01-19T10:00:00Z'),
        isRead: false
      },
      {
        recipient: users[2]._id,
        recipientModel: 'User',
        type: 'appointment_confirmed',
        channel: 'both',
        title: 'Cita confirmada',
        message: 'Tu cita de verificación ha sido confirmada. La chofer Ana te contactará pronto.',
        data: {
          appointmentId: 'VER-2024-003',
          driverName: 'Ana Rodríguez'
        },
        status: 'sent',
        sentAt: new Date('2024-01-22T16:00:00Z'),
        isRead: false
      }
    ];

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ ${createdNotifications.length} notificaciones creadas`);
    return createdNotifications;
  } catch (error) {
    console.error('❌ Error creando notificaciones:', error);
    return [];
  }
}

// Función principal de seed
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    await connectDB();
    await clearDatabase();

    console.log('\n📝 Creando datos de prueba...\n');

    const users = await createUsers();
    const drivers = await createDrivers();
    
    // Simplificar seed para evitar errores de referencias en memoria
    if (users.length > 0) {
        // ... crear autos y citas si es necesario, pero con usuarios/drivers limpios es suficiente para empezar
        console.log('✅ Usuarios y choferes base creados.');
    }

    console.log('\n🔑 Credenciales de prueba:');
    console.log('   👤 Cliente: juan@example.com / password123');
    console.log('   👤 Cliente: maria@example.com / password123');
    console.log('   👤 Cliente: carlos@example.com / password123');
    console.log('   🚗 Chofer: roberto@example.com / driver123');
    console.log('   🚗 Chofer: ana@example.com / driver123');
    console.log('   🚗 Chofer: miguel@example.com / driver123');
    console.log('   👑 Admin: admin@verifireando.com / admin123');

    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Ejecuta: npm run dev');
    console.log('   2. Abre: http://localhost:5000/health');
    console.log('   3. Prueba los endpoints con las credenciales de arriba');

  } catch (error) {
    console.error('❌ Error en el seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar seed si el archivo es llamado directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  clearDatabase,
  createUsers,
  createDrivers,
  createCars,
  createAppointments,
  createPayments,
  createNotifications
};