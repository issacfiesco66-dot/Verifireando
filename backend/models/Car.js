const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El propietario es requerido']
  },
  plates: {
    type: String,
    required: [true, 'Las placas son requeridas'],
    uppercase: true,
    match: [/^[A-Z0-9]{6,8}$/, 'Formato de placas inválido']
  },
  brand: {
    type: String,
    required: [true, 'La marca es requerida'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'El modelo es requerido'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'El año es requerido'],
    min: [1990, 'El año debe ser mayor a 1990'],
    max: [new Date().getFullYear() + 1, 'El año no puede ser futuro']
  },
  color: {
    type: String,
    required: [true, 'El color es requerido'],
    trim: true
  },
  engineType: {
    type: String,
    enum: ['gasoline', 'diesel', 'hybrid', 'electric'],
    default: 'gasoline'
  },
  documents: {
    registration: {
      number: String,
      expiry: Date,
      photo: String // URL de la foto
    },
    insurance: {
      company: String,
      policyNumber: String,
      expiry: Date,
      photo: String
    }
  },
  photos: [String], // URLs de fotos del vehículo
  verificationHistory: [{
    date: { type: Date, required: true },
    center: String,
    result: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      required: true
    },
    certificate: String, // URL del certificado
    nextVerificationDue: Date,
    notes: String
  }],
  nextVerificationDue: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    vin: String, // Número de serie del vehículo
    engineNumber: String,
    cylinderCapacity: Number,
    fuelType: String,
    transmission: {
      type: String,
      enum: ['manual', 'automatic']
    }
  }
}, {
  timestamps: true
});

// Índices
carSchema.index({ owner: 1 });
carSchema.index({ plates: 1 });
carSchema.index({ nextVerificationDue: 1 });
carSchema.index({ 'verificationHistory.date': -1 });

// Índice compuesto para búsquedas eficientes
carSchema.index({ owner: 1, isActive: 1 });

// Método para verificar si necesita verificación
carSchema.methods.needsVerification = function() {
  if (!this.nextVerificationDue) return true;
  return new Date() >= this.nextVerificationDue;
};

// Método para obtener la última verificación
carSchema.methods.getLastVerification = function() {
  if (this.verificationHistory.length === 0) return null;
  return this.verificationHistory.sort((a, b) => b.date - a.date)[0];
};

// Método para agregar nueva verificación
carSchema.methods.addVerification = function(verificationData) {
  this.verificationHistory.push(verificationData);
  
  // Actualizar próxima fecha de verificación (6 meses después)
  if (verificationData.result === 'approved') {
    const nextDate = new Date(verificationData.date);
    nextDate.setMonth(nextDate.getMonth() + 6);
    this.nextVerificationDue = nextDate;
  }
  
  return this.save();
};

// Método para verificar si el vehículo está vencido
carSchema.methods.isOverdue = function() {
  if (!this.nextVerificationDue) return false;
  const today = new Date();
  const gracePeriod = new Date(this.nextVerificationDue);
  gracePeriod.setDate(gracePeriod.getDate() + 30); // 30 días de gracia
  
  return today > gracePeriod;
};

// Método para obtener días hasta vencimiento
carSchema.methods.getDaysUntilDue = function() {
  if (!this.nextVerificationDue) return null;
  const today = new Date();
  const diffTime = this.nextVerificationDue - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Virtual para el nombre completo del vehículo
carSchema.virtual('fullName').get(function() {
  return `${this.brand} ${this.model} ${this.year}`;
});

// Asegurar que los virtuals se incluyan en JSON
carSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Car', carSchema);