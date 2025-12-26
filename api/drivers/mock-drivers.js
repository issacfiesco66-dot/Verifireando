const jwt = require('jsonwebtoken');

// Mock driver data
const mockDrivers = [
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Carlos Rodríguez',
    email: 'chofer@test.com',
    phone: '+525512345678',
    role: 'driver',
    isVerified: true,
    isActive: true,
    isOnline: true,
    isAvailable: true,
    rating: 4.8,
    totalRatings: 156,
    licenseNumber: 'LIC123456789',
    licenseExpiry: '2025-12-31',
    vehicleInfo: {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      plates: 'ABC-123-D',
      color: 'Blanco',
      photos: []
    },
    location: {
      type: 'Point',
      coordinates: [-99.1332, 19.4326]
    },
    workingHours: {
      start: '08:00',
      end: '20:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    earnings: 15420.50,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-12-10T15:30:00.000Z'
  }
];

// Mock appointments data (shared with appointments mock)
let mockAppointments = [
  {
    _id: '507f1f77bcf86cd799439013',
    client: '507f1f77bcf86cd799439011',
    car: '507f1f77bcf86cd799439012',
    scheduledDate: '2024-12-15T10:00:00.000Z',
    scheduledTime: '10:00',
    timeSlot: { start: '10:00', end: '11:00' },
    services: { verification: true, additionalServices: [] },
    pickupAddress: {
      street: 'Av. Reforma 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06700',
      coordinates: { type: 'Point', coordinates: [-99.1332, 19.4326] }
    },
    deliveryAddress: {
      street: 'Av. Insurgentes 456',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06700',
      coordinates: { type: 'Point', coordinates: [-99.1277, 19.4285] }
    },
    status: 'assigned',
    pricing: { basePrice: 400, additionalServicesPrice: 0, taxes: 50, total: 450 },
    notes: 'Primera cita de prueba',
    preferredDriver: null,
    driver: '507f1f77bcf86cd799439013',
    statusHistory: [
      { status: 'pending', timestamp: '2024-12-15T08:00:00.000Z', notes: 'Cita creada' },
      { status: 'assigned', timestamp: '2024-12-15T08:30:00.000Z', notes: 'Cita asignada al chofer' }
    ],
    createdAt: '2024-12-15T08:00:00.000Z',
    updatedAt: '2024-12-15T08:30:00.000Z'
  }
];

// Helper function to verify JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }
  
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
  } catch (error) {
    throw new Error('Token inválido');
  }
}

// Get available appointments for driver
function getAvailableAppointments(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden ver citas disponibles' });
    }

    // Find driver
    const driver = mockDrivers.find(d => d._id === user.userId);
    if (!driver || !driver.isOnline || !driver.isAvailable) {
      return res.status(400).json({ message: 'Debes estar conectado y disponible para ver citas' });
    }

    // Get pending appointments
    const availableAppointments = mockAppointments.filter(appointment => 
      appointment.status === 'pending'
    );

    res.json({
      appointments: availableAppointments,
      pagination: {
        page: 1,
        limit: 10,
        total: availableAppointments.length,
        pages: 1
      }
    });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Accept appointment
function acceptAppointment(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    const appointmentId = req.params.id;
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden aceptar citas' });
    }

    // Find driver
    const driver = mockDrivers.find(d => d._id === user.userId);
    if (!driver || !driver.isOnline || !driver.isAvailable) {
      return res.status(400).json({ message: 'Debes estar conectado y disponible para aceptar citas' });
    }

    // Find appointment
    const appointment = mockAppointments.find(a => a._id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Esta cita ya no está disponible' });
    }

    // Assign driver to appointment
    appointment.driver = user.userId;
    appointment.status = 'assigned';
    appointment.statusHistory.push({
      status: 'assigned',
      timestamp: new Date().toISOString(),
      notes: 'Cita aceptada por el chofer'
    });
    appointment.updatedAt = new Date().toISOString();

    // Mark driver as unavailable
    driver.isAvailable = false;

    res.json({
      message: 'Cita aceptada exitosamente',
      appointment: {
        id: appointment._id,
        appointmentNumber: appointment.appointmentNumber || `APP-${appointment._id.slice(-6)}`,
        status: appointment.status
      }
    });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Update driver status (online/offline)
function updateDriverStatus(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    const { isOnline } = req.body;
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden cambiar su estado' });
    }

    const driver = mockDrivers.find(d => d._id === user.userId);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    driver.isOnline = isOnline;
    if (!isOnline) {
      driver.isAvailable = false; // If going offline, also set as unavailable
    }
    driver.updatedAt = new Date().toISOString();

    res.json({
      message: `Estado actualizado: ${isOnline ? 'conectado' : 'desconectado'}`,
      driver: {
        id: driver._id,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable
      }
    });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Update driver availability
function updateDriverAvailability(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    const { isAvailable } = req.body;
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden cambiar su disponibilidad' });
    }

    const driver = mockDrivers.find(d => d._id === user.userId);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    if (isAvailable && !driver.isOnline) {
      return res.status(400).json({ message: 'Debes estar conectado para estar disponible' });
    }

    driver.isAvailable = isAvailable;
    driver.updatedAt = new Date().toISOString();

    res.json({
      message: `Disponibilidad actualizada: ${isAvailable ? 'disponible' : 'no disponible'}`,
      driver: {
        id: driver._id,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable
      }
    });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Get driver profile
function getDriverProfile(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const driver = mockDrivers.find(d => d._id === user.userId);
    if (!driver) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    // Remove sensitive information
    const { password, bankInfo, ...safeDriver } = driver;
    
    res.json({ driver: safeDriver });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Start verification
function startVerification(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden iniciar verificación' });
    }

    const appointmentId = req.params.id;
    const appointment = mockAppointments.find(a => a._id === appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.driver !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para esta cita' });
    }

    if (appointment.status !== 'assigned') {
      return res.status(400).json({ 
        message: `No se puede cambiar de ${appointment.status} a in_verification` 
      });
    }

    // Update status
    appointment.status = 'in_verification';
    appointment.statusHistory.push({
      status: 'in_verification',
      timestamp: new Date().toISOString(),
      notes: 'Verificación iniciada por el chofer'
    });
    appointment.updatedAt = new Date().toISOString();

    res.json({
      message: 'Verificación iniciada exitosamente',
      appointment: {
        id: appointment._id,
        status: appointment.status,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Complete verification
function completeVerification(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden completar verificación' });
    }

    const appointmentId = req.params.id;
    const appointment = mockAppointments.find(a => a._id === appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.driver !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para esta cita' });
    }

    if (appointment.status !== 'in_verification') {
      return res.status(400).json({ 
        message: `No se puede cambiar de ${appointment.status} a completed` 
      });
    }

    // Update status
    appointment.status = 'completed';
    appointment.statusHistory.push({
      status: 'completed',
      timestamp: new Date().toISOString(),
      notes: 'Verificación completada por el chofer'
    });
    appointment.updatedAt = new Date().toISOString();

    res.json({
      message: 'Verificación completada exitosamente',
      appointment: {
        id: appointment._id,
        status: appointment.status,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Create payment intent
function createPaymentIntent(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden crear intenciones de pago' });
    }

    const appointmentId = req.params.id;
    const appointment = mockAppointments.find(a => a._id === appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.driver !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para esta cita' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ 
        message: 'La verificación debe estar completada para crear el pago' 
      });
    }

    // Simulate payment intent creation
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount: appointment.pricing.total * 100, // Convert to cents
      currency: 'mxn',
      status: 'requires_payment_method',
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    };

    res.json({
      message: 'Intención de pago creada exitosamente',
      paymentIntent: paymentIntent,
      appointment: {
        id: appointment._id,
        status: appointment.status,
        total: appointment.pricing.total
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Confirm payment and deliver
function confirmPaymentAndDeliver(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    if (user.role !== 'driver') {
      return res.status(403).json({ message: 'Solo los choferes pueden confirmar pagos' });
    }

    const appointmentId = req.params.id;
    const appointment = mockAppointments.find(a => a._id === appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.driver !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para esta cita' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ 
        message: 'La verificación debe estar completada para confirmar el pago' 
      });
    }

    // Update status to delivered
    appointment.status = 'delivered';
    appointment.statusHistory.push({
      status: 'delivered',
      timestamp: new Date().toISOString(),
      notes: 'Pago confirmado y vehículo entregado'
    });
    appointment.updatedAt = new Date().toISOString();

    // Mark driver as available again
    const driver = mockDrivers.find(d => d._id === user.userId);
    if (driver) {
      driver.isAvailable = true;
    }

    res.json({
      message: 'Pago confirmado y vehículo entregado exitosamente',
      appointment: {
        id: appointment._id,
        status: appointment.status,
        updatedAt: appointment.updatedAt
      },
      payment: {
        status: 'completed',
        amount: appointment.pricing.total * 100,
        currency: 'mxn'
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

module.exports = {
  getAvailableAppointments,
  acceptAppointment,
  updateDriverStatus,
  updateDriverAvailability,
  getDriverProfile,
  startVerification,
  completeVerification,
  createPaymentIntent,
  confirmPaymentAndDeliver,
  mockDrivers,
  mockAppointments
};