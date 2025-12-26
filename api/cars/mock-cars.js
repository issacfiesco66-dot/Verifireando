const jwt = require('jsonwebtoken');

// Mock data for cars
let mockCars = [
  {
    _id: '507f1f77bcf86cd799439011',
    plates: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    color: 'Blanco',
    engineType: 'gasoline',
    owner: '507f1f77bcf86cd799439011', // cliente@test.com
    isActive: true,
    verificationHistory: [],
    documents: {
      registration: {
        number: 'REG123456',
        expiryDate: new Date('2025-12-31'),
        photos: []
      },
      insurance: {
        company: 'Seguros Test',
        policyNumber: 'POL789',
        expiryDate: new Date('2025-06-30'),
        photos: []
      }
    },
    metadata: {
      vin: '1HGBH41JXMN109186',
      engineNumber: 'ENG123456',
      notes: 'Vehículo en excelente estado'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    _id: '507f1f77bcf86cd799439012',
    plates: 'XYZ789',
    brand: 'Honda',
    model: 'Civic',
    year: 2019,
    color: 'Azul',
    engineType: 'gasoline',
    owner: '507f1f77bcf86cd799439011', // cliente@test.com
    isActive: true,
    verificationHistory: [
      {
        date: new Date('2024-01-10'),
        status: 'approved',
        inspector: 'Inspector Test',
        notes: 'Verificación exitosa'
      }
    ],
    documents: {
      registration: {
        number: 'REG789012',
        expiryDate: new Date('2025-08-15'),
        photos: []
      },
      insurance: {
        company: 'Seguros Premium',
        policyNumber: 'POL456',
        expiryDate: new Date('2025-03-20'),
        photos: []
      }
    },
    metadata: {
      vin: '2HGBH41JXMN109187',
      engineNumber: 'ENG789012',
      notes: 'Mantenimiento al día'
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  }
];

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Token inválido');
  }
};

// Get user's cars
const getMyCars = (req, res) => {
  try {
    const user = verifyToken(req);
    
    // Filter cars by owner
    const userCars = mockCars.filter(car => car.owner === user.userId);
    
    res.json({
      message: 'Vehículos obtenidos exitosamente',
      cars: userCars,
      pagination: {
        page: 1,
        limit: 10,
        total: userCars.length,
        pages: 1
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Get car by ID
const getCarById = (req, res) => {
  try {
    const user = verifyToken(req);
    const { id } = req.params;
    
    const car = mockCars.find(car => car._id === id);
    
    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    
    // Check if user owns the car or is admin
    if (car.owner !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver este vehículo' 
      });
    }
    
    res.json({ car });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Create new car
const createCar = (req, res) => {
  try {
    const user = verifyToken(req);
    const carData = req.body;
    
    // Check if plates already exist
    const existingCar = mockCars.find(car => car.plates === carData.plates);
    if (existingCar) {
      return res.status(409).json({ 
        message: 'Ya existe un vehículo registrado con estas placas' 
      });
    }
    
    // Create new car
    const newCar = {
      _id: Date.now().toString(), // Simple ID generation
      plates: carData.plates,
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      color: carData.color,
      engineType: carData.engineType || 'gasoline',
      owner: user.userId,
      isActive: true,
      verificationHistory: [],
      documents: carData.documents || {},
      metadata: carData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockCars.push(newCar);
    
    res.status(201).json({
      message: 'Vehículo registrado exitosamente',
      car: newCar
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Update car
const updateCar = (req, res) => {
  try {
    const user = verifyToken(req);
    const { id } = req.params;
    const updateData = req.body;
    
    const carIndex = mockCars.findIndex(car => car._id === id);
    
    if (carIndex === -1) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    
    const car = mockCars[carIndex];
    
    // Check if user owns the car or is admin
    if (car.owner !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'No tienes permisos para actualizar este vehículo' 
      });
    }
    
    // Update car data
    mockCars[carIndex] = {
      ...car,
      ...updateData,
      updatedAt: new Date()
    };
    
    res.json({
      message: 'Vehículo actualizado exitosamente',
      car: mockCars[carIndex]
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Delete car
const deleteCar = (req, res) => {
  try {
    const user = verifyToken(req);
    const { id } = req.params;
    
    const carIndex = mockCars.findIndex(car => car._id === id);
    
    if (carIndex === -1) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    
    const car = mockCars[carIndex];
    
    // Check if user owns the car or is admin
    if (car.owner !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'No tienes permisos para eliminar este vehículo' 
      });
    }
    
    // Remove car from array
    mockCars.splice(carIndex, 1);
    
    res.json({
      message: 'Vehículo eliminado exitosamente'
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

module.exports = {
  getMyCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar
};