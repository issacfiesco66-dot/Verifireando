const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'El código del cupón es requerido'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number, // Solo aplica para porcentaje
    default: null
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number, // Límite total de usos
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableServices: [{
    type: String, // Códigos de servicio (e.g., 'verification', 'wash')
    default: [] // Si está vacío, aplica a todos
  }]
}, {
  timestamps: true
});

couponSchema.methods.isValid = function(amount, serviceCodes = []) {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, reason: 'Cupón inactivo' };
  if (now < this.validFrom) return { valid: false, reason: 'Cupón aún no vigente' };
  if (now > this.validUntil) return { valid: false, reason: 'Cupón expirado' };
  if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, reason: 'Límite de usos alcanzado' };
  if (amount < this.minPurchase) return { valid: false, reason: `Monto mínimo de compra: $${this.minPurchase}` };

  // Verificar si aplica a los servicios seleccionados
  if (this.applicableServices.length > 0) {
    const applies = serviceCodes.some(code => this.applicableServices.includes(code));
    if (!applies) return { valid: false, reason: 'Este cupón no aplica para los servicios seleccionados' };
  }

  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(amount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (amount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }
  
  // El descuento no puede ser mayor al monto total
  return Math.min(discount, amount);
};

module.exports = mongoose.model('Coupon', couponSchema);
