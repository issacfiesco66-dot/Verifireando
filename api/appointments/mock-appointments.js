const jwt = require('jsonwebtoken');

// Mock appointments data
let mockAppointments = [
  {
    _id: '507f1f77bcf86cd799439013',
    client: '507f1f77bcf86cd799439011', // cliente@test.com
    car: '507f1f77bcf86cd799439011', // Toyota Corolla
    scheduledDate: new Date('2024-12-15'),
    scheduledTime: '10:00',
    timeSlot: {
      start: '10:00',
      end: '11:00'
    },
    services: {
      verification: true,
      additionalServices: []
    },
    pickupAddress: {
      street: 'Av. Insurgentes Sur 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '03100',
      coordinates: {
        type: 'Point',
        coordinates: [-99.1332, 19.4326] // [longitude, latitude]
      }
    },
    deliveryAddress: {
      street: 'Av. Insurgentes Sur 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '03100',
      coordinates: {
        type: 'Point',
        coordinates: [-99.1332, 19.4326]
      }
    },
    status: 'pending',
    pricing: {
      basePrice: 500,
      additionalServicesPrice: 0,
      taxes: 80,
      total: 580
    },
    notes: 'Primera cita de verificación',
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date('2024-12-10T10:00:00Z'),
        notes: 'Cita creada'
      }
    ],
    createdAt: new Date('2024-12-10T10:00:00Z'),
    updatedAt: new Date('2024-12-10T10:00:00Z')
  }
];

// Helper function to verify JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }
  
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
  } catch (error) {
    throw new Error('Token inválido');
  }
}

// Helper function to generate new ID
function generateId() {
  return Date.now().toString();
}

// Helper function to calculate end time
function calculateEndTime(startTime) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + 1; // 1 hour duration by default
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Get appointments for the authenticated user
function getMyAppointments(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    // Filter appointments by user role
    let filteredAppointments = [...mockAppointments];
    
    if (user.role === 'client') {
      filteredAppointments = filteredAppointments.filter(appointment => 
        appointment.client === user.userId
      );
    } else if (user.role === 'driver') {
      filteredAppointments = filteredAppointments.filter(appointment => 
        appointment.driver === user.userId
      );
    }
    // Admin sees all appointments
    
    // Apply filters from query parameters
    const { status, date, page = 1, limit = 10 } = req.query;
    
    if (status) {
      filteredAppointments = filteredAppointments.filter(appointment => 
        appointment.status === status
      );
    }
    
    if (date) {
      const filterDate = new Date(date);
      const nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      
      filteredAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduledDate);
        return appointmentDate >= filterDate && appointmentDate < nextDay;
      });
    }
    
    // Sort by creation date (newest first)
    filteredAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const skip = (page - 1) * limit;
    const total = filteredAppointments.length;
    const appointments = filteredAppointments.slice(skip, skip + parseInt(limit));
    
    res.json({
      message: 'Citas obtenidas exitosamente',
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Get appointment by ID
function getAppointmentById(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    const appointmentId = req.params.id;
    
    const appointment = mockAppointments.find(apt => apt._id === appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    // Check if user has permission to view this appointment
    if (user.role === 'client' && appointment.client !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para ver esta cita' });
    }
    
    if (user.role === 'driver' && appointment.driver !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para ver esta cita' });
    }
    
    res.json({
      message: 'Cita obtenida exitosamente',
      appointment
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Create new appointment
function createAppointment(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    
    if (user.role !== 'client') {
      return res.status(403).json({ message: 'Solo los clientes pueden crear citas' });
    }
    
    const {
      car,
      scheduledDate,
      scheduledTime,
      services = { verification: true, additionalServices: [] },
      pickupAddress,
      deliveryAddress,
      notes = '',
      preferredDriver = null
    } = req.body;
    
    // Basic validation
    if (!car || !scheduledDate || !scheduledTime || !pickupAddress || !deliveryAddress) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: car, scheduledDate, scheduledTime, pickupAddress, deliveryAddress' 
      });
    }
    
    // Check if there's already a pending appointment for this car
    const pendingAppointment = mockAppointments.find(apt => 
      apt.car === car && 
      apt.client === user.userId &&
      ['pending', 'assigned', 'driver_enroute', 'picked_up', 'in_verification'].includes(apt.status)
    );
    
    if (pendingAppointment) {
      return res.status(409).json({ 
        message: 'Ya tienes una cita pendiente para este vehículo' 
      });
    }
    
    // Create new appointment
    const newAppointment = {
      _id: generateId(),
      client: user.userId,
      car,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      timeSlot: {
        start: scheduledTime,
        end: calculateEndTime(scheduledTime)
      },
      services,
      pickupAddress: {
        ...pickupAddress,
        coordinates: {
          type: 'Point',
          coordinates: pickupAddress.coordinates ? 
            [pickupAddress.coordinates.lng, pickupAddress.coordinates.lat] : 
            [-99.1332, 19.4326] // Default coordinates for Mexico City
        }
      },
      deliveryAddress: {
        ...deliveryAddress,
        coordinates: {
          type: 'Point',
          coordinates: deliveryAddress.coordinates ? 
            [deliveryAddress.coordinates.lng, deliveryAddress.coordinates.lat] : 
            [-99.1332, 19.4326] // Default coordinates for Mexico City
        }
      },
      status: 'pending',
      pricing: {
        basePrice: 500,
        additionalServicesPrice: services.additionalServices?.reduce((sum, service) => sum + (service.price || 0), 0) || 0,
        taxes: 80,
        total: 580 + (services.additionalServices?.reduce((sum, service) => sum + (service.price || 0), 0) || 0)
      },
      notes,
      preferredDriver,
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          notes: 'Cita creada'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockAppointments.push(newAppointment);
    
    res.status(201).json({
      message: 'Cita creada exitosamente',
      appointment: newAppointment
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Update appointment status
function updateAppointmentStatus(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    const appointmentId = req.params.id;
    const { status, notes = '' } = req.body;
    
    const appointmentIndex = mockAppointments.findIndex(apt => apt._id === appointmentId);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    const appointment = mockAppointments[appointmentIndex];
    
    // Check permissions
    if (user.role === 'client' && appointment.client !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta cita' });
    }
    
    if (user.role === 'driver' && appointment.driver !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta cita' });
    }
    
    // Update appointment
    appointment.status = status;
    appointment.statusHistory.push({
      status,
      timestamp: new Date(),
      notes
    });
    appointment.updatedAt = new Date();
    
    mockAppointments[appointmentIndex] = appointment;
    
    res.json({
      message: 'Estado de cita actualizado exitosamente',
      appointment
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Cancel appointment
function cancelAppointment(req, res) {
  try {
    const user = verifyToken(req.headers.authorization);
    const appointmentId = req.params.id;
    const { reason = 'Cancelado por el usuario' } = req.body;
    
    const appointmentIndex = mockAppointments.findIndex(apt => apt._id === appointmentId);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    const appointment = mockAppointments[appointmentIndex];
    
    // Check permissions
    if (user.role === 'client' && appointment.client !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para cancelar esta cita' });
    }
    
    if (user.role === 'driver' && appointment.driver !== user.userId) {
      return res.status(403).json({ message: 'No tienes permisos para cancelar esta cita' });
    }
    
    // Update appointment status to cancelled
    appointment.status = 'cancelled';
    appointment.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      notes: reason
    });
    appointment.updatedAt = new Date();
    
    mockAppointments[appointmentIndex] = appointment;
    
    res.json({
      message: 'Cita cancelada exitosamente',
      appointment
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

module.exports = {
  getMyAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment
};