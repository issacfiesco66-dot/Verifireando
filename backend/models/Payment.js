const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'La cita es requerida']
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente es requerido']
  },
  paymentNumber: {
    type: String,
    unique: true,
    required: true
  },
  amount: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxes: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  currency: {
    type: String,
    default: 'MXN',
    enum: ['MXN', 'USD']
  },
  method: {
    type: String,
    enum: ['card', 'cash', 'transfer', 'wallet'],
    required: true
  },
  provider: {
    type: String,
    enum: ['stripe', 'mercadopago', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',     // Pendiente
      'processing',  // Procesando
      'completed',   // Completado
      'failed',      // Fallido
      'cancelled',   // Cancelado
      'refunded',    // Reembolsado
      'partial_refund' // Reembolso parcial
    ],
    default: 'pending'
  },
  paymentIntent: {
    // Para Stripe
    stripePaymentIntentId: String,
    stripeClientSecret: String,
    
    // Para MercadoPago
    mercadopagoId: String,
    mercadopagoStatus: String,
    
    // Metadatos del proveedor
    providerResponse: mongoose.Schema.Types.Mixed
  },
  // Campos directos para compatibilidad
  stripePaymentIntentId: String,
  stripeChargeId: String,
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    receiptUrl: String,
    transactionId: String
  },
  timeline: {
    created: { type: Date, default: Date.now },
    authorized: Date,
    captured: Date,
    completed: Date,
    failed: Date,
    cancelled: Date,
    refunded: Date
  },
  refunds: [{
    amount: { type: Number, required: true },
    reason: String,
    notes: String,
    refundId: String,
    processedAt: { type: Date, default: Date.now },
    processedBy: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  }],
  fees: {
    platformFee: { type: Number, default: 0 },
    processingFee: { type: Number, default: 0 },
    driverEarnings: { type: Number, default: 0 }
  },
  receipt: {
    number: String,
    url: String,
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    paymentSource: String, // 'web', 'mobile', 'admin'
    notes: String
  },
  webhookEvents: [{
    eventType: String,
    eventId: String,
    receivedAt: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Índices
paymentSchema.index({ appointment: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'paymentIntent.stripePaymentIntentId': 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ stripeChargeId: 1 });
paymentSchema.index({ 'paymentIntent.mercadopagoId': 1 });
paymentSchema.index({ createdAt: -1 });

// Índices compuestos
paymentSchema.index({ client: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Middleware para generar número de pago
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentNumber) {
    const count = await this.constructor.countDocuments();
    this.paymentNumber = `PAY${new Date().getFullYear()}${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

// Método para actualizar estado
paymentSchema.methods.updateStatus = function(newStatus, metadata = {}) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Actualizar timeline
  const now = new Date();
  switch (newStatus) {
    case 'processing':
      this.timeline.authorized = now;
      break;
    case 'completed':
      this.timeline.completed = now;
      this.timeline.captured = now;
      break;
    case 'failed':
      this.timeline.failed = now;
      break;
    case 'cancelled':
      this.timeline.cancelled = now;
      break;
    case 'refunded':
      this.timeline.refunded = now;
      break;
  }
  
  // Agregar metadatos si se proporcionan
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  
  return this.save();
};

// Método para procesar reembolso
paymentSchema.methods.processRefund = function(amount, reason = '', notes = '', processedBy = null, stripeRefundId = null) {
  const refund = {
    amount,
    reason,
    notes,
    refundId: stripeRefundId || `ref_${Date.now()}`,
    processedAt: new Date(),
    processedBy: processedBy,
    status: 'completed'
  };
  
  this.refunds.push(refund);
  
  // Determinar si es reembolso total o parcial
  const totalRefunded = this.refunds.reduce((sum, r) => sum + r.amount, 0);
  if (totalRefunded >= this.amount.total) {
    this.status = 'refunded';
    this.timeline.refunded = new Date();
  } else {
    this.status = 'partial_refund';
  }
  
  return this.save();
};

// Método para calcular comisiones
paymentSchema.methods.calculateFees = function() {
  const total = this.amount.total;
  
  // Comisión de la plataforma (5%)
  this.fees.platformFee = Math.round(total * 0.05 * 100) / 100;
  
  // Comisión de procesamiento (3.6% + $3 MXN para tarjetas)
  if (this.method === 'card') {
    this.fees.processingFee = Math.round((total * 0.036 + 3) * 100) / 100;
  } else {
    this.fees.processingFee = 0;
  }
  
  // Ganancias del chofer (90% del restante)
  const remaining = total - this.fees.platformFee - this.fees.processingFee;
  this.fees.driverEarnings = Math.round(remaining * 0.9 * 100) / 100;
  
  return this.fees;
};

// Método para generar recibo
paymentSchema.methods.generateReceipt = function() {
  if (!this.receipt.number) {
    this.receipt.number = `REC${this.paymentNumber}`;
    // En producción, aquí generarías el PDF del recibo
    this.receipt.url = `/receipts/${this.receipt.number}.pdf`;
  }
  return this.receipt;
};

// Método para verificar si puede ser reembolsado
paymentSchema.methods.canBeRefunded = function() {
  const refundableStatuses = ['completed'];
  const totalRefunded = this.refunds.reduce((sum, r) => sum + r.amount, 0);
  return refundableStatuses.includes(this.status) && totalRefunded < this.amount.total;
};

// Virtual para obtener monto disponible para reembolso
paymentSchema.virtual('refundableAmount').get(function() {
  const totalRefunded = this.refunds.reduce((sum, r) => sum + r.amount, 0);
  return Math.max(0, this.amount.total - totalRefunded);
});

// Método para agregar evento de webhook
paymentSchema.methods.addWebhookEvent = function(eventType, eventId, data) {
  this.webhookEvents.push({
    eventType,
    eventId,
    data,
    receivedAt: new Date()
  });
  return this.save();
};

// Asegurar que los virtuals se incluyan en JSON
paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);