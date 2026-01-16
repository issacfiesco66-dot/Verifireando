const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente es requerido']
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'El vehículo es requerido']
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appointmentNumber: {
    type: String,
    unique: true,
    required: false // Se genera automáticamente en pre-save
  },
  scheduledDate: {
    type: Date,
    required: [true, 'La fecha programada es requerida']
  },
  timeSlot: {
    start: { type: String, required: true }, // "09:00"
    end: { type: String, required: true }     // "10:00"
  },
  services: {
    verification: {
      type: Boolean,
      default: true,
      required: true
    },
    additionalServices: [{
      name: {
        type: String,
        enum: [
          'wash',           // Lavado de auto
          'oil_change',     // Cambio de aceite
          'spark_plugs',    // Cambio de bujías
          'brakes',         // Frenos
          'air_filter',     // Filtro de aire
          'tire_check',     // Revisión de llantas
          'battery_check',  // Revisión de batería
          'brake_check',    // Revisión de frenos
          'transmission',   // Transmisión
          'cooling_system', // Sistema de enfriamiento
          'electrical',     // Sistema eléctrico
          'suspension',     // Suspensión
          'exhaust',        // Sistema de escape
          'fuel_system'     // Sistema de combustible
        ],
        required: true
      },
      price: { type: Number, required: true },
      description: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      evidence: [{
        url: String, // URL de foto/video
        description: String,
        uploadedAt: { type: Date, default: Date.now }
      }]
    }]
  },
  pickupAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    instructions: String
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String,
    sameAsPickup: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: [
      'pending',        // Pendiente de asignación
      'assigned',       // Chofer asignado
      'driver_enroute', // Chofer en camino
      'picked_up',      // Vehículo recogido
      'in_verification',// En proceso de verificación
      'completed',      // Verificación completada
      'delivered',      // Vehículo entregado
      'cancelled'       // Cancelada
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'statusHistory.updatedByModel'
    },
    updatedByModel: {
      type: String,
      enum: ['User', 'Driver']
    }
  }],
  pricing: {
    basePrice: { type: Number, required: true },
    additionalServicesPrice: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  verificationResult: {
    passed: Boolean,
    certificate: String, // URL del certificado
    issues: [String],
    notes: String,
    verificationCenter: String,
    verifiedAt: Date,
    nextVerificationDue: Date
  },
  timeline: {
    created: { type: Date, default: Date.now },
    assigned: Date,
    pickedUp: Date,
    verificationStarted: Date,
    verificationCompleted: Date,
    delivered: Date,
    cancelled: Date
  },
  rating: {
    clientRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date
    },
    driverRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date
    }
  },
  notes: String,
  cancellationReason: String,
  estimatedDuration: Number, // en minutos
  actualDuration: Number,    // en minutos
  pickupCode: {
    type: String,
    default: null // Código de 6 dígitos para que el cliente verifique al chofer
  },
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices
appointmentSchema.index({ client: 1 });
appointmentSchema.index({ driver: 1 });
appointmentSchema.index({ car: 1 });
appointmentSchema.index({ scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'pickupAddress.coordinates.coordinates': '2dsphere' });

// Índices compuestos
appointmentSchema.index({ status: 1, scheduledDate: 1 });
appointmentSchema.index({ driver: 1, status: 1 });

// Middleware para generar número de cita
appointmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.appointmentNumber) {
    const count = await this.constructor.countDocuments();
    this.appointmentNumber = `VER${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Método para actualizar estado
appointmentSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = null, updatedByModel = 'User') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    notes,
    updatedBy,
    updatedByModel
  });
  
  // Actualizar timeline
  const now = new Date();
  switch (newStatus) {
    case 'assigned':
      this.timeline.assigned = now;
      break;
    case 'picked_up':
      this.timeline.pickedUp = now;
      break;
    case 'in_verification':
      this.timeline.verificationStarted = now;
      break;
    case 'completed':
      this.timeline.verificationCompleted = now;
      break;
    case 'delivered':
      this.timeline.delivered = now;
      if (this.timeline.pickedUp) {
        this.actualDuration = Math.round((now - this.timeline.pickedUp) / (1000 * 60));
      }
      break;
    case 'cancelled':
      this.timeline.cancelled = now;
      break;
  }
  
  return this.save();
};

// Método para calcular precio total
appointmentSchema.methods.calculateTotal = function() {
  let total = this.pricing.basePrice;
  
  if (this.services.additionalServices) {
    total += this.services.additionalServices.reduce((sum, service) => sum + service.price, 0);
  }
  
  const taxes = total * 0.16; // IVA 16%
  this.pricing.additionalServicesPrice = total - this.pricing.basePrice;
  this.pricing.taxes = taxes;
  this.pricing.total = total + taxes;
  
  return this.pricing.total;
};

// Método para generar código de verificación para el encuentro
appointmentSchema.methods.generatePickupCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.pickupCode = code;
  return code;
};

// Método para verificar si puede ser cancelada
appointmentSchema.methods.canBeCancelled = function() {
  const cancelableStatuses = ['pending', 'assigned', 'driver_enroute'];
  return cancelableStatuses.includes(this.status);
};

// Método para obtener tiempo estimado de llegada
appointmentSchema.methods.getETA = function() {
  if (!this.driver || this.status !== 'driver_enroute') return null;
  
  // Lógica simple de ETA (en producción usarías Google Maps API)
  const baseTime = 15; // 15 minutos base
  const randomFactor = Math.random() * 10; // 0-10 minutos adicionales
  return Math.round(baseTime + randomFactor);
};

// Virtual para obtener duración total
appointmentSchema.virtual('totalDuration').get(function() {
  if (this.timeline.delivered && this.timeline.created) {
    return Math.round((this.timeline.delivered - this.timeline.created) / (1000 * 60));
  }
  return null;
});

// Asegurar que los virtuals se incluyan en JSON
appointmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Appointment', appointmentSchema);