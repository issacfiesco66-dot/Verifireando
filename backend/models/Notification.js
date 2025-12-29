const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'El destinatario es requerido'],
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['User', 'Driver']
  },
  type: {
    type: String,
    enum: [
      'appointment_created',
      'appointment_assigned',
      'appointment_status',
      'new_appointment',
      'driver_enroute',
      'vehicle_picked_up',
      'verification_started',
      'verification_completed',
      'service_completed',
      'vehicle_delivered',
      'payment_completed',
      'appointment_cancelled',
      'driver_nearby',
      'verification_reminder',
      'rating_request',
      'promotion',
      'system_update'
    ],
    required: true
  },
  channel: {
    type: String,
    enum: ['push', 'whatsapp', 'email', 'sms'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  message: {
    type: String,
    required: [true, 'El mensaje es requerido'],
    maxlength: [500, 'El mensaje no puede exceder 500 caracteres']
  },
  data: {
    // Datos adicionales específicos del tipo de notificación
    appointmentId: mongoose.Schema.Types.ObjectId,
    driverId: mongoose.Schema.Types.ObjectId,
    paymentId: mongoose.Schema.Types.ObjectId,
    actionUrl: String,
    imageUrl: String,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  deliveryDetails: {
    // Para notificaciones push
    fcmMessageId: String,
    fcmResponse: mongoose.Schema.Types.Mixed,
    
    // Para WhatsApp
    whatsappMessageId: String,
    whatsappStatus: String,
    
    // Para email
    emailMessageId: String,
    emailProvider: String,
    
    // Metadatos generales
    attempts: { type: Number, default: 0 },
    lastAttempt: Date,
    deliveredAt: Date,
    readAt: Date,
    errorMessage: String
  },
  scheduling: {
    scheduledFor: Date, // Para notificaciones programadas
    timezone: String,
    isRecurring: { type: Boolean, default: false },
    recurringPattern: String // 'daily', 'weekly', 'monthly'
  },
  template: {
    templateId: String,
    templateVariables: mongoose.Schema.Types.Mixed
  },
  metadata: {
    source: String, // 'system', 'admin', 'driver', 'client'
    campaign: String,
    tags: [String],
    locale: { type: String, default: 'es' }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Índices
notificationSchema.index({ recipient: 1, recipientModel: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ channel: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'scheduling.scheduledFor': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Índices compuestos
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ status: 1, 'scheduling.scheduledFor': 1 });

// Método para marcar como enviada
notificationSchema.methods.markAsSent = function(deliveryInfo = {}) {
  this.status = 'sent';
  this.deliveryDetails.deliveredAt = new Date();
  
  // Actualizar detalles específicos del canal
  Object.assign(this.deliveryDetails, deliveryInfo);
  
  return this.save();
};

// Método para marcar como leída
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.deliveryDetails.readAt = this.readAt;
    
    if (this.status === 'delivered') {
      this.status = 'read';
    }
  }
  return this.save();
};

// Método para marcar como fallida
notificationSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.deliveryDetails.errorMessage = errorMessage;
  this.deliveryDetails.lastAttempt = new Date();
  this.deliveryDetails.attempts += 1;
  
  return this.save();
};

// Método para reintentar envío
notificationSchema.methods.retry = function() {
  if (this.deliveryDetails.attempts < 3) {
    this.status = 'pending';
    this.deliveryDetails.lastAttempt = new Date();
    return this.save();
  }
  return Promise.reject(new Error('Máximo número de intentos alcanzado'));
};

// Método para verificar si puede ser reenviada
notificationSchema.methods.canRetry = function() {
  return this.status === 'failed' && this.deliveryDetails.attempts < 3;
};

// Método para verificar si está expirada
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Método estático para crear notificación de cita
notificationSchema.statics.createAppointmentNotification = function(
  recipient, 
  recipientModel, 
  type, 
  appointmentData, 
  channel = 'push'
) {
  const templates = {
    appointment_created: {
      title: 'Cita Creada',
      message: `Tu cita de verificación para el ${appointmentData.date} ha sido creada exitosamente.`
    },
    appointment_assigned: {
      title: 'Chofer Asignado',
      message: `${appointmentData.driverName} ha sido asignado a tu cita. Te contactará pronto.`
    },
    driver_enroute: {
      title: 'Chofer en Camino',
      message: `${appointmentData.driverName} está en camino a recoger tu vehículo. ETA: ${appointmentData.eta} min.`
    },
    vehicle_picked_up: {
      title: 'Vehículo Recogido',
      message: 'Tu vehículo ha sido recogido y está en camino al centro de verificación.'
    },
    verification_completed: {
      title: 'Verificación Completada',
      message: `Tu vehículo ha ${appointmentData.passed ? 'aprobado' : 'no aprobado'} la verificación.`
    },
    vehicle_delivered: {
      title: 'Vehículo Entregado',
      message: 'Tu vehículo ha sido entregado exitosamente. ¡Gracias por usar nuestro servicio!'
    }
  };
  
  const template = templates[type];
  if (!template) {
    throw new Error(`Template no encontrado para el tipo: ${type}`);
  }
  
  return this.create({
    recipient,
    recipientModel,
    type,
    channel,
    title: template.title,
    message: template.message,
    data: {
      appointmentId: appointmentData.appointmentId,
      driverId: appointmentData.driverId,
      priority: appointmentData.priority || 'normal'
    }
  });
};

// Método estático para obtener notificaciones no leídas
notificationSchema.statics.getUnreadCount = function(recipient, recipientModel) {
  return this.countDocuments({
    recipient,
    recipientModel,
    isRead: false,
    status: { $in: ['sent', 'delivered'] }
  });
};

// Método estático para marcar todas como leídas
notificationSchema.statics.markAllAsRead = function(recipient, recipientModel) {
  return this.updateMany(
    {
      recipient,
      recipientModel,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Virtual para obtener tiempo transcurrido
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'ahora';
});

// Asegurar que los virtuals se incluyan en JSON
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);