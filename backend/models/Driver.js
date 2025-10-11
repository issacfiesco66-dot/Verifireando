const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    match: [/^(\+52)?[0-9]{10}$/, 'Formato de teléfono inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  role: {
    type: String,
    default: 'driver'
  },
  licenseNumber: {
    type: String,
    required: [true, 'El número de licencia es requerido'],
    unique: true
  },
  licenseExpiry: {
    type: Date,
    required: [true, 'La fecha de vencimiento de licencia es requerida']
  },
  vehicleInfo: {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    plates: { type: String, required: true, unique: true },
    color: { type: String, required: true },
    photos: [String]
  },
  documents: {
    license: String, // URL del documento
    vehicleRegistration: String,
    insurance: String,
    criminalRecord: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  completedTrips: {
    type: Number,
    default: 0
  },
  earnings: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    paid: { type: Number, default: 0 }
  },
  workingHours: {
    start: String, // "08:00"
    end: String,   // "18:00"
    days: [String] // ["monday", "tuesday", ...]
  },
  fcmToken: String,
  pushSubscription: {
    type: Object
  },
  userAgent: {
    type: String
  },
  lastPushSubscriptionUpdate: {
    type: Date
  },
  bankInfo: {
    accountNumber: String,
    bankName: String,
    accountHolder: String,
    clabe: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices
driverSchema.index({ email: 1 });
driverSchema.index({ phone: 1 });
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ 'vehicleInfo.plates': 1 });
driverSchema.index({ location: '2dsphere' });
driverSchema.index({ isOnline: 1, isAvailable: 1 });

// Middleware para hashear contraseña
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
driverSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para generar código de verificación
driverSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
  return code;
};

// Método para verificar código
driverSchema.methods.verifyCode = function(code) {
  return this.verificationCode === code && 
         this.verificationCodeExpires > new Date();
};

// Método para actualizar ubicación
driverSchema.methods.updateLocation = function(lat, lng) {
  this.location.coordinates = [lng, lat];
  this.lastLocationUpdate = new Date();
  return this.save();
};

// Método para calcular distancia a un punto
driverSchema.methods.distanceTo = function(lat, lng) {
  const [driverLng, driverLat] = this.location.coordinates;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat - driverLat) * Math.PI / 180;
  const dLng = (lng - driverLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(driverLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Método para actualizar rating
driverSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Método para limpiar datos sensibles
driverSchema.methods.toJSON = function() {
  const driver = this.toObject();
  delete driver.password;
  delete driver.verificationCode;
  delete driver.verificationCodeExpires;
  return driver;
};

module.exports = mongoose.model('Driver', driverSchema);