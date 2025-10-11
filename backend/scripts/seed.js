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
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/verifireando');
    console.log('✅ Conectado a MongoDB');
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
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+525512345678',
        password: await bcrypt.hash('password123', 12),
        isVerified: true,
        role: 'client',
        address: {
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
        fcmToken: 'fcm_token_juan_123'
      },
      {
        name: 'María García',
        email: 'maria@example.com',
        phone: '+525587654321',
        password: await bcrypt.hash('password123', 12),
        isVerified: true,
        role: 'client',
        address: {
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
        fcmToken: 'fcm_token_maria_456'
      },
      {
        name: 'Carlos López',
        email: 'carlos@example.com',
        phone: '+525598765432',
        password: await bcrypt.hash('password123', 12),
        isVerified: true,
        role: 'client',
        address: {
          street: 'Av. Reforma 789',
          neighborhood: 'Polanco',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '11560',
          coordinates: {
            lat: 19.4284,
            lng: -99.1692
          }
        }
      },
      {
        name: 'Admin Usuario',
        email: 'admin@verifireando.com',
        phone: '+525511111111',
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
        name: 'Roberto Martínez',
        email: 'roberto@example.com',
        phone: '+525522222222',
        password: await bcrypt.hash('driver123', 12),
        isVerified: true,
        role: 'driver',
        license: {
          number: 'LIC123456789',
          type: 'Automovilista',
          expiryDate: new Date('2025-12-31'),
          state: 'CDMX'
        },
        vehicle: {
          plates: 'ABC-123-D',
          brand: 'Nissan',
          model: 'Versa',
          year: 2020,
          color: 'Blanco'
        },
        documents: {
          license: {
            url: '/uploads/drivers/license_roberto.pdf',
            verified: true,
            verifiedAt: new Date()
          },
          vehicleRegistration: {
            url: '/uploads/drivers/registration_roberto.pdf',
            verified: true,
            verifiedAt: new Date()
          },
          insurance: {
            url: '/uploads/drivers/insurance_roberto.pdf',
            verified: true,
            verifiedAt: new Date()
          }
        },
        location: {
          coordinates: {
            lat: 19.4326,
            lng: -99.1332
          },
          address: 'Roma Norte, CDMX',
          lastUpdated: new Date()
        },
        isOnline: true,
        isAvailable: true,
        verificationStatus: 'verified',
        rating: {
          average: 4.8,
          count: 25
        },
        stats: {
          totalTrips: 25,
          completedTrips: 24,
          cancelledTrips: 1
        },
        fcmToken: 'fcm_token_roberto_789'
      },
      {
        name: 'Ana Rodríguez',
        email: 'ana@example.com',
        phone: '+525533333333',
        password: await bcrypt.hash('driver123', 12),
        isVerified: true,
        role: 'driver',
        license: {
          number: 'LIC987654321',
          type: 'Automovilista',
          expiryDate: new Date('2025-06-30'),
          state: 'EdoMéx'
        },
        vehicle: {
          plates: 'XYZ-789-E',
          brand: 'Chevrolet',
          model: 'Aveo',
          year: 2019,
          color: 'Azul'
        },
        documents: {
          license: {
            url: '/uploads/drivers/license_ana.pdf',
            verified: true,
            verifiedAt: new Date()
          },
          vehicleRegistration: {
            url: '/uploads/drivers/registration_ana.pdf',
            verified: true,
            verifiedAt: new Date()
          },
          insurance: {
            url: '/uploads/drivers/insurance_ana.pdf',
            verified: true,
            verifiedAt: new Date()
          }
        },
        location: {
          coordinates: {
            lat: 19.4284,
            lng: -99.1692
          },
          address: 'Polanco, CDMX',
          lastUpdated: new Date()
        },
        isOnline: true,
        isAvailable: true,
        verificationStatus: 'verified',
        rating: {
          average: 4.9,
          count: 18
        },
        stats: {
          totalTrips: 18,
          completedTrips: 18,
          cancelledTrips: 0
        },
        fcmToken: 'fcm_token_ana_012'
      },
      {
        name: 'Miguel Torres',
        email: 'miguel@example.com',
        phone: '+525544444444',
        password: await bcrypt.hash('driver123', 12),
        isVerified: true,
        role: 'driver',
        license: {
          number: 'LIC456789123',
          type: 'Automovilista',
          expiryDate: new Date('2024-12-31'),
          state: 'CDMX'
        },
        vehicle: {
          plates: 'DEF-456-G',
          brand: 'Toyota',
          model: 'Yaris',
          year: 2021,
          color: 'Gris'
        },
        documents: {
          license: {
            url: '/uploads/drivers/license_miguel.pdf',
            verified: false
          },
          vehicleRegistration: {
            url: '/uploads/drivers/registration_miguel.pdf',
            verified: false
          }
        },
        location: {
          coordinates: {
            lat: 19.4342,
            lng: -99.1386
          },
          address: 'Centro, CDMX',
          lastUpdated: new Date()
        },
        isOnline: false,
        isAvailable: false,
        verificationStatus: 'pending',
        rating: {
          average: 0,
          count: 0
        },
        stats: {
          totalTrips: 0,
          completedTrips: 0,
          cancelledTrips: 0
        }
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
        owner: users[0]._id, // Juan
        plates: 'JUA-123-N',
        brand: 'Honda',
        model: 'Civic',
        year: 2018,
        color: 'Negro',
        engineType: 'Gasolina',
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
        verificationHistory: [
          {
            date: new Date('2023-01-15'),
            result: 'approved',
            inspector: 'Inspector García',
            notes: 'Vehículo en excelente estado',
            nextDueDate: new Date('2024-01-15')
          }
        ],
        nextVerificationDue: new Date('2024-01-15'),
        isActive: true,
        metadata: {
          vin: '1HGBH41JXMN109186',
          engineNumber: 'ENG123456'
        }
      },
      {
        owner: users[1]._id, // María
        plates: 'MAR-456-I',
        brand: 'Volkswagen',
        model: 'Jetta',
        year: 2020,
        color: 'Blanco',
        engineType: 'Gasolina',
        documents: {
          registration: {
            url: '/uploads/cars/registration_vw.pdf',
            expiryDate: new Date('2025-03-31')
          },
          insurance: {
            url: '/uploads/cars/insurance_vw.pdf',
            expiryDate: new Date('2024-09-30')
          }
        },
        photos: [
          '/uploads/cars/vw_front.jpg'
        ],
        verificationHistory: [
          {
            date: new Date('2023-06-10'),
            result: 'approved',
            inspector: 'Inspector López',
            notes: 'Verificación exitosa',
            nextDueDate: new Date('2024-06-10')
          }
        ],
        nextVerificationDue: new Date('2024-06-10'),
        isActive: true,
        metadata: {
          vin: '3VW2K7AJ5LM123456',
          engineNumber: 'ENG789012'
        }
      },
      {
        owner: users[2]._id, // Carlos
        plates: 'CAR-789-L',
        brand: 'Ford',
        model: 'Focus',
        year: 2017,
        color: 'Rojo',
        engineType: 'Gasolina',
        documents: {
          registration: {
            url: '/uploads/cars/registration_ford.pdf',
            expiryDate: new Date('2024-08-31')
          }
        },
        photos: [],
        verificationHistory: [],
        nextVerificationDue: new Date('2024-02-15'),
        isActive: true,
        metadata: {
          vin: '1FADP3F20HL123456',
          engineNumber: 'ENG345678'
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
    const cars = await createCars(users);
    const appointments = await createAppointments(users, drivers, cars);
    const payments = await createPayments(appointments);
    const notifications = await createNotifications(users, drivers);

    console.log('\n✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`   👥 Usuarios: ${users.length}`);
    console.log(`   🚗 Choferes: ${drivers.length}`);
    console.log(`   🚙 Autos: ${cars.length}`);
    console.log(`   📅 Citas: ${appointments.length}`);
    console.log(`   💳 Pagos: ${payments.length}`);
    console.log(`   🔔 Notificaciones: ${notifications.length}`);

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