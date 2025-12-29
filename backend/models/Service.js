const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del servicio es requerido'],
    unique: true
  },
  code: {
    type: String,
    required: [true, 'El código del servicio es requerido'],
    unique: true,
    enum: [
      'verification',   // Verificación vehicular
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
    ]
  },
  description: {
    type: String,
    required: [true, 'La descripción del servicio es requerida']
  },
  category: {
    type: String,
    enum: ['verification', 'maintenance', 'repair', 'cleaning'],
    required: [true, 'La categoría del servicio es requerida']
  },
  basePrice: {
    type: Number,
    required: [true, 'El precio base es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  driverCommission: {
    type: Number,
    required: [true, 'La comisión del conductor es requerida'],
    min: [0, 'La comisión no puede ser negativa'],
    max: [100, 'La comisión no puede ser mayor al 100%']
  },
  estimatedDuration: {
    type: Number, // en minutos
    required: [true, 'La duración estimada es requerida'],
    min: [1, 'La duración debe ser al menos 1 minuto']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requirements: [{
    type: String,
    description: String
  }],
  icon: {
    type: String,
    default: 'wrench'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  tags: [String],
  metadata: {
    popularity: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Índices
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ basePrice: 1 });

// Métodos
serviceSchema.methods.calculateDriverEarnings = function(totalPrice) {
  return (totalPrice * this.driverCommission) / 100;
};

serviceSchema.methods.calculateCompanyEarnings = function(totalPrice) {
  return totalPrice - this.calculateDriverEarnings(totalPrice);
};

// Método estático para obtener servicios por categoría
serviceSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ basePrice: 1 });
};

// Método estático para obtener servicios populares
serviceSchema.statics.getPopular = function(limit = 5) {
  return this.find({ isActive: true })
    .sort({ 'metadata.popularity': -1, 'metadata.averageRating': -1 })
    .limit(limit);
};

// Virtual para precio formateado
serviceSchema.virtual('formattedPrice').get(function() {
  return `$${this.basePrice.toFixed(2)}`;
});

// Virtual para duración formateada
serviceSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.estimatedDuration / 60);
  const minutes = this.estimatedDuration % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
});

serviceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema);