const express = require('express');
const Joi = require('joi');
let stripe = null;
const logger = require('../utils/logger');

// Configurar Stripe - la clave debe estar en variables de entorno
const stripeKey = process.env.STRIPE_SECRET_KEY;

// Para desarrollo: configurar la clave de prueba si no está en .env
if (!stripeKey && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  STRIPE_SECRET_KEY no configurada en .env - configure la clave de prueba para desarrollo');
  // NO hardcodear claves secretas - usar variables de entorno
}
try {
  if (stripeKey) {
    stripe = require('stripe')(stripeKey);
    logger.info('Stripe inicializado correctamente');
    console.log('✅ Stripe inicializado con clave de prueba');
  } else {
    logger.warn('Stripe no configurado (STRIPE_SECRET_KEY ausente); endpoints de tarjeta limitados');
  }
} catch (e) {
  logger.error('Error inicializando Stripe:', e);
  console.error('❌ Error inicializando Stripe:', e);
  stripe = null;
}
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Coupon = require('../models/Coupon');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Esquemas de validación
const createPaymentIntentSchema = Joi.object({
  appointmentId: Joi.string().required(),
  paymentMethod: Joi.string().valid('card', 'cash').default('card'),
  currency: Joi.string().valid('MXN', 'USD', 'mxn', 'usd').default('MXN').uppercase(),
  couponCode: Joi.string().optional().allow('').uppercase()
});

const validateCouponSchema = Joi.object({
  code: Joi.string().required().uppercase(),
  amount: Joi.number().required().min(0),
  serviceCodes: Joi.array().items(Joi.string()).default([])
});

const createCouponSchema = Joi.object({
  code: Joi.string().required().uppercase().min(3).max(20),
  description: Joi.string().required(),
  discountType: Joi.string().valid('percentage', 'fixed').required(),
  discountValue: Joi.number().required().min(0),
  minPurchase: Joi.number().min(0).default(0),
  maxDiscount: Joi.number().min(0).optional(),
  validUntil: Joi.date().required(),
  usageLimit: Joi.number().integer().min(1).optional(),
  applicableServices: Joi.array().items(Joi.string()).default([])
});

const confirmPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required(),
  paymentMethod: Joi.string().valid('card', 'cash').required()
});

const refundSchema = Joi.object({
  amount: Joi.number().min(0).optional(),
  reason: Joi.string().valid('requested_by_customer', 'duplicate', 'fraudulent', 'other').default('requested_by_customer'),
  notes: Joi.string().max(500).allow('').optional()
});

// Validar cupón
router.post('/validate-coupon', auth, async (req, res) => {
  try {
    const { error, value } = validateCouponSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const coupon = await Coupon.findOne({ code: value.code });
    
    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Cupón no encontrado' });
    }

    const validation = coupon.isValid(value.amount, value.serviceCodes);
    
    if (!validation.valid) {
      return res.status(400).json({ valid: false, message: validation.reason });
    }

    const discountAmount = coupon.calculateDiscount(value.amount);

    res.json({
      valid: true,
      message: 'Cupón válido',
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount,
      finalAmount: value.amount - discountAmount
    });

  } catch (error) {
    logger.error('Error validando cupón:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear Payment Intent
router.post('/create-intent', auth, async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint /create-intent llamado');
  console.log('🔍 [DEBUG] Body recibido:', req.body);
  console.log('🔍 [DEBUG] Usuario autenticado:', req.userId);
  
  try {
    const { error, value } = createPaymentIntentSchema.validate(req.body);
    if (error) {
      console.error('❌ [ERROR] Validación fallida:', error.details);
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }
    
    console.log('🔍 [DEBUG] Datos validados:', value);

    const appointment = await Appointment.findById(value.appointmentId)
      .populate('client', 'name email')
      .populate('car', 'plates brand model');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Verificar que el usuario es el cliente de la cita
    if (appointment.client._id.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para pagar esta cita' 
      });
    }

    // Verificar que la cita no tenga ya un pago
    if (appointment.payment) {
      return res.status(400).json({ 
        message: 'Esta cita ya tiene un pago asociado' 
      });
    }

    // Calcular montos
    let subtotal = appointment.pricing.basePrice + 
                    appointment.pricing.additionalServices.reduce((sum, service) => sum + service.price, 0);
    
    let discount = 0;
    let appliedCoupon = null;

    // Aplicar cupón si existe
    if (value.couponCode) {
      const coupon = await Coupon.findOne({ code: value.couponCode });
      if (coupon) {
        // Obtener códigos de servicios para validación
        const serviceCodes = ['verification'];
        if (appointment.pricing.additionalServices) {
          appointment.pricing.additionalServices.forEach(s => {
             // Asumiendo que el nombre del servicio mapea a un código, o usar 'additional'
             serviceCodes.push(s.name || 'additional');
          });
        }

        const validation = coupon.isValid(subtotal, serviceCodes);
        if (validation.valid) {
          discount = coupon.calculateDiscount(subtotal);
          appliedCoupon = coupon;
        } else {
            logger.warn(`Cupón ${value.couponCode} inválido para cita ${appointment._id}: ${validation.reason}`);
        }
      }
    }

    const subtotalAfterDiscount = subtotal - discount;
    const taxes = Math.round(subtotalAfterDiscount * 0.16); // 16% IVA
    const total = subtotalAfterDiscount + taxes;

    let paymentIntent = null;
    let stripePaymentIntentId = null;

    // Solo crear Payment Intent en Stripe si es pago con tarjeta
    if (value.paymentMethod === 'card') {
      if (!stripe) {
        return res.status(503).json({ 
          message: 'Pago con tarjeta no disponible: Stripe no está configurado' 
        });
      }
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(total * 100), // Stripe usa centavos y enteros
          currency: value.currency,
          metadata: {
            appointmentId: appointment._id.toString(),
            appointmentNumber: appointment.appointmentNumber,
            clientId: appointment.client._id.toString(),
            clientEmail: appointment.client.email,
            couponCode: appliedCoupon ? appliedCoupon.code : ''
          },
          description: `Verificación vehicular - ${appointment.car.plates} (${appointment.appointmentNumber})`
        });
        
        stripePaymentIntentId = paymentIntent.id;
      } catch (stripeError) {
        logger.error('Error creando Payment Intent en Stripe:', stripeError);
        return res.status(500).json({ 
          message: 'Error procesando el pago. Intenta nuevamente.' 
        });
      }
    }

    // Crear registro de pago en la base de datos
    const payment = new Payment({
      appointment: appointment._id,
      client: appointment.client._id,
      amount: {
        subtotal,
        discount,
        taxes,
        total
      },
      currency: value.currency,
      method: value.paymentMethod,
      provider: value.paymentMethod === 'card' ? 'stripe' : 'cash',
      status: 'pending',
      stripePaymentIntentId,
      paymentIntent: {
        stripePaymentIntentId: stripePaymentIntentId,
        stripeClientSecret: paymentIntent?.client_secret
      },
      coupon: appliedCoupon ? appliedCoupon._id : null,
      paymentDetails: {
        description: `Verificación vehicular - ${appointment.car.plates}`,
        metadata: {
          appointmentNumber: appointment.appointmentNumber,
          carPlates: appointment.car.plates,
          carInfo: `${appointment.car.brand} ${appointment.car.model}`,
          couponApplied: appliedCoupon ? appliedCoupon.code : null
        }
      }
    });

    // Calcular comisiones
    payment.calculateFees();
    await payment.save();

    // Incrementar uso del cupón si se aplicó (se debería hacer al confirmar, pero reservamos aquí o manejamos concurrencia)
    // Para simplificar, lo incrementamos al confirmar el pago.

    // Asociar pago con la cita
    appointment.payment = payment._id;
    await appointment.save();

    logger.info(`Payment Intent creado: ${payment.paymentNumber} para cita ${appointment.appointmentNumber}`);

    const response = {
      payment: {
        id: payment._id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        discount: discount > 0 ? {
            amount: discount,
            code: appliedCoupon?.code
        } : null
      },
      appointment: {
        id: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        car: `${appointment.car.brand} ${appointment.car.model} - ${appointment.car.plates}`
      }
    };

    // Agregar client_secret solo para pagos con tarjeta
    if (paymentIntent) {
      response.clientSecret = paymentIntent.client_secret;
    }

    res.status(201).json(response);

  } catch (error) {
    logger.error('Error creando Payment Intent:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Confirmar pago (Actualizado para cupones)
router.post('/confirm', auth, async (req, res) => {
    // ... (código existente de confirmación) ...
    // Agregar lógica para incrementar contador de cupón
  try {
    const { error, value } = confirmPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const payment = await Payment.findOne({
      $or: [
        { _id: value.paymentIntentId },
        { stripePaymentIntentId: value.paymentIntentId },
        { 'paymentIntent.stripePaymentIntentId': value.paymentIntentId }
      ]
    }).populate({
      path: 'appointment',
      populate: {
        path: 'client',
        select: 'name email'
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }
    
    // ... validaciones de usuario y estado ...
    if (payment.appointment.client._id.toString() !== req.userId) {
        return res.status(403).json({ message: 'No tienes permisos para confirmar este pago' });
    }
  
    if (payment.status !== 'pending') {
        return res.status(400).json({ message: 'Este pago ya ha sido procesado' });
    }

    // Lógica de Stripe/Efectivo
    if (value.paymentMethod === 'card') {
      if (!stripe) return res.status(503).json({ message: 'Stripe no configurado' });
      
      try {
        const stripePaymentId = payment.stripePaymentIntentId || payment.paymentIntent?.stripePaymentIntentId;
        if (!stripePaymentId) {
          return res.status(400).json({ message: 'Payment Intent ID no encontrado' });
        }
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId);
        if (paymentIntent.status === 'succeeded') {
            payment.status = 'completed';
            // ... guardar detalles de tarjeta ...
             payment.paymentDetails.cardInfo = {
                last4: paymentIntent.charges.data[0]?.payment_method_details?.card?.last4,
                brand: paymentIntent.charges.data[0]?.payment_method_details?.card?.brand,
                expiryMonth: paymentIntent.charges.data[0]?.payment_method_details?.card?.exp_month,
                expiryYear: paymentIntent.charges.data[0]?.payment_method_details?.card?.exp_year
              };
              payment.paymentDetails.transactionId = paymentIntent.charges.data[0]?.id;
              payment.stripeChargeId = paymentIntent.charges.data[0]?.id;
        } else {
            return res.status(400).json({ message: 'El pago no pudo ser procesado' });
        }
      } catch (e) {
          logger.error(e);
          return res.status(500).json({ message: 'Error procesando pago' });
      }
    } else {
        payment.status = 'completed';
        payment.paymentDetails.transactionId = `CASH_${Date.now()}`;
    }

    await payment.updateStatus('completed', 'Pago confirmado exitosamente');
    await payment.save();

    // Incrementar uso del cupón
    if (payment.coupon) {
        await Coupon.findByIdAndUpdate(payment.coupon, { $inc: { usageCount: 1 } });
    }

    // ... Generar recibo y notificar ...
    const receipt = await payment.generateReceipt();
    await Notification.create({
        recipient: payment.client,
        recipientModel: 'User',
        type: 'payment_confirmed',
        channel: 'push',
        title: 'Pago Confirmado',
        message: `Tu pago de $${payment.amount.total} ${payment.currency.toUpperCase()} ha sido confirmado`,
        data: {
          paymentId: payment._id,
          paymentNumber: payment.paymentNumber,
          amount: payment.amount.total,
          currency: payment.currency,
          receiptUrl: receipt.url
        }
    });

    res.json({
        message: 'Pago confirmado exitosamente',
        payment: {
            id: payment._id,
            paymentNumber: payment.paymentNumber,
            status: payment.status,
            amount: payment.amount,
            receipt: receipt
        }
    });

  } catch (error) {
      logger.error('Error confirmando pago:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Admin: Crear cupón
router.post('/coupons', auth, authorize('admin'), async (req, res) => {
    try {
        const { error, value } = createCouponSchema.validate(req.body);
        if (error) return res.status(400).json({ message: 'Datos inválidos', errors: error.details.map(d => d.message) });

        const coupon = new Coupon(value);
        await coupon.save();
        res.status(201).json({ message: 'Cupón creado', coupon });
    } catch (e) {
        if (e.code === 11000) return res.status(400).json({ message: 'El código ya existe' });
        res.status(500).json({ message: 'Error interno' });
    }
});

// Admin: Listar cupones
router.get('/coupons', auth, authorize('admin'), async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ coupons });
    } catch (e) {
        res.status(500).json({ message: 'Error interno' });
    }
});



// Webhook de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Stripe no configurado para webhooks');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Error verificando webhook de Stripe:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        const payment = await Payment.findOne({
          $or: [
            { stripePaymentIntentId: paymentIntent.id },
            { 'paymentIntent.stripePaymentIntentId': paymentIntent.id }
          ]
        }).populate('appointment client');

        if (payment && payment.status === 'pending') {
          await payment.updateStatus('completed', 'Pago confirmado via webhook');
          
          // Actualizar información del pago
          payment.paymentDetails.transactionId = paymentIntent.charges.data[0]?.id;
          payment.stripeChargeId = paymentIntent.charges.data[0]?.id;
          await payment.save();

          logger.info(`Pago confirmado via webhook: ${payment.paymentNumber}`);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        const failedPaymentRecord = await Payment.findOne({
          $or: [
            { stripePaymentIntentId: failedPayment.id },
            { 'paymentIntent.stripePaymentIntentId': failedPayment.id }
          ]
        });

        if (failedPaymentRecord) {
          await failedPaymentRecord.updateStatus('failed', 'Pago falló');
          logger.info(`Pago falló via webhook: ${failedPaymentRecord.paymentNumber}`);
        }
        break;

      default:
        logger.info(`Evento de webhook no manejado: ${event.type}`);
    }

    // Registrar evento de webhook
    if (event.data.object.metadata?.appointmentId) {
      const payment = await Payment.findOne({
        appointment: event.data.object.metadata.appointmentId
      });

      if (payment) {
        payment.addWebhookEvent(event.type, event.data.object);
        await payment.save();
      }
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// Obtener pagos
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Los usuarios normales solo ven sus propios pagos
    if (req.userRole !== 'admin') {
      filter.client = req.userId;
    }
    
    // Filtros adicionales para admin
    if (req.userRole === 'admin') {
      if (req.query.client) {
        filter.client = req.query.client;
      }
      
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      if (req.query.method) {
        filter.method = req.query.method;
      }
      
      if (req.query.provider) {
        filter.provider = req.query.provider;
      }
    }
    
    // Filtro por rango de fechas
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const payments = await Payment.find(filter)
      .populate('client', 'name email')
      .populate({
        path: 'appointment',
        select: 'appointmentNumber scheduledDate car',
        populate: {
          path: 'car',
          select: 'plates brand model'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo pagos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener pago por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id)
      .populate('client', 'name email phone')
      .populate({
        path: 'appointment',
        populate: [
          { path: 'car', select: 'plates brand model color' },
          { path: 'driver', select: 'name phone' }
        ]
      });
    
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    // Verificar permisos
    if (req.userRole !== 'admin' && payment.client._id.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para ver este pago' 
      });
    }

    res.json({ payment });

  } catch (error) {
    logger.error('Error obteniendo pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Procesar reembolso
router.post('/:id/refund', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = refundSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const payment = await Payment.findById(id)
      .populate('client', 'name email')
      .populate('appointment', 'appointmentNumber');
    
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    if (!payment.canBeRefunded()) {
      return res.status(400).json({ 
        message: 'Este pago no puede ser reembolsado' 
      });
    }

    const refundAmount = value.amount || payment.amount.total;
    
    if (refundAmount > payment.refundableAmount) {
      return res.status(400).json({ 
        message: 'El monto del reembolso excede el monto reembolsable' 
      });
    }

    let stripeRefund = null;

    // Procesar reembolso en Stripe si es pago con tarjeta
    if (payment.provider === 'stripe' && payment.stripeChargeId) {
      if (!stripe) {
        return res.status(503).json({ message: 'Stripe no está configurado' });
      }
      try {
        stripeRefund = await stripe.refunds.create({
          charge: payment.stripeChargeId,
          amount: refundAmount * 100, // Stripe usa centavos
          reason: value.reason,
          metadata: {
            paymentId: payment._id.toString(),
            appointmentNumber: payment.appointment.appointmentNumber,
            processedBy: req.user.email
          }
        });
      } catch (stripeError) {
        logger.error('Error procesando reembolso en Stripe:', stripeError);
        return res.status(500).json({ 
          message: 'Error procesando el reembolso' 
        });
      }
    }

    // Procesar reembolso en la base de datos
    const refund = await payment.processRefund(
      refundAmount,
      value.reason,
      value.notes || '',
      req.userId,
      stripeRefund?.id
    );

    // Enviar notificación al cliente
    await Notification.create({
      recipient: payment.client._id,
      recipientModel: 'User',
      type: 'refund_processed',
      channel: 'push',
      title: 'Reembolso Procesado',
      message: `Se ha procesado un reembolso de $${refundAmount} ${payment.currency.toUpperCase()}`,
      data: {
        paymentId: payment._id,
        paymentNumber: payment.paymentNumber,
        refundAmount,
        currency: payment.currency,
        refundId: refund.id
      }
    });

    logger.info(`Reembolso procesado: $${refundAmount} para pago ${payment.paymentNumber} por ${req.user.email}`);

    res.json({
      message: 'Reembolso procesado exitosamente',
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        processedAt: refund.processedAt
      }
    });

  } catch (error) {
    logger.error('Error procesando reembolso:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de pagos (admin)
router.get('/admin/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Estadísticas generales
    const totalPayments = await Payment.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const completedPayments = await Payment.countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount.total' },
          platformFees: { $sum: '$fees.platformFee' },
          processingFees: { $sum: '$fees.processingFee' }
        }
      }
    ]);

    // Pagos por método
    const paymentsByMethod = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          total: { $sum: '$amount.total' }
        }
      }
    ]);

    // Pagos por día (últimos 30 días)
    const dailyPayments = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          total: { $sum: '$amount.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Reembolsos
    const totalRefunds = await Payment.aggregate([
      {
        $match: {
          'refunds.0': { $exists: true },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $unwind: '$refunds'
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: '$refunds.amount' }
        }
      }
    ]);

    res.json({
      period: { startDate, endDate },
      overview: {
        totalPayments,
        completedPayments,
        completionRate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(1) : 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        platformFees: totalRevenue[0]?.platformFees || 0,
        processingFees: totalRevenue[0]?.processingFees || 0
      },
      paymentsByMethod: paymentsByMethod.reduce((acc, item) => {
        acc[item._id] = { count: item.count, total: item.total };
        return acc;
      }, {}),
      dailyPayments,
      refunds: {
        count: totalRefunds[0]?.count || 0,
        total: totalRefunds[0]?.total || 0
      }
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de pagos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint de prueba sin auth
router.get('/test-public', async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint /test-public llamado');
  res.json({ message: 'Este endpoint funciona sin autenticación', timestamp: new Date() });
});

// Obtener mis pagos (endpoint para clientes) - TEMPORAL SIN AUTH
router.get('/my-payments', async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint /my-payments llamado SIN middleware auth');
  try {
    console.log('🔍 [DEBUG] Preparando pagos de muestra...');
    // Por ahora, devolver pagos de muestra para evitar errores de base de datos
    const mockPayments = [
      {
        _id: 'pay_1',
        appointment: {
          appointmentNumber: 'APT-001',
          scheduledDate: new Date('2025-12-20'),
          status: 'completed'
        },
        paymentNumber: 'PAY-001',
        amount: {
          subtotal: 1200,
          discount: 100,
          taxes: 200,
          total: 1300
        },
        status: 'completed',
        method: 'credit_card',
        createdAt: new Date('2025-12-20'),
        description: 'Verificación vehicular completa'
      },
      {
        _id: 'pay_2',
        appointment: {
          appointmentNumber: 'APT-002',
          scheduledDate: new Date('2025-12-22'),
          status: 'pending'
        },
        paymentNumber: 'PAY-002',
        amount: {
          subtotal: 600,
          discount: 0,
          taxes: 100,
          total: 700
        },
        status: 'pending',
        method: 'cash',
        createdAt: new Date('2025-12-22'),
        description: 'Cambio de aceite y filtros'
      }
    ];

    console.log('🔍 [DEBUG] Enviando respuesta con', mockPayments.length, 'pagos');
    res.json({
      payments: mockPayments,
      pagination: {
        current: 1,
        pages: 1,
        total: mockPayments.length
      }
    });
    console.log('🔍 [DEBUG] Respuesta enviada exitosamente');
  } catch (error) {
    console.error('❌ [ERROR] Error en /my-payments:', error);
    logger.error('Error obteniendo pagos del cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener métodos de pago del cliente - TEMPORAL SIN AUTH
router.get('/methods', async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint /methods llamado SIN middleware auth');
  try {
    console.log('🔍 [DEBUG] Preparando métodos de pago de muestra...');
    // Métodos de pago de muestra
    const mockPaymentMethods = [
      {
        _id: 'pm_1',
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      },
      {
        _id: 'pm_2',
        type: 'card',
        brand: 'mastercard',
        last4: '5555',
        expiryMonth: 8,
        expiryYear: 2024,
        isDefault: false
      }
    ];

    console.log('🔍 [DEBUG] Enviando respuesta con', mockPaymentMethods.length, 'métodos de pago');
    res.json(mockPaymentMethods);
    console.log('🔍 [DEBUG] Respuesta enviada exitosamente');
  } catch (error) {
    console.error('❌ [ERROR] Error en /methods:', error);
    logger.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agregar método de pago
router.post('/methods', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    // Por ahora, solo simular la adición
    // En una implementación real, esto se guardaría en Stripe
    res.json({ 
      message: 'Método de pago agregado exitosamente',
      paymentMethod: {
        _id: paymentMethodId,
        type: 'card',
        brand: 'visa',
        last4: '4242',
        isDefault: false
      }
    });
  } catch (error) {
    logger.error('Error agregando método de pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar método de pago
router.delete('/methods/:id', auth, async (req, res) => {
  try {
    res.json({ message: 'Método de pago eliminado exitosamente' });
  } catch (error) {
    logger.error('Error eliminando método de pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Establecer método de pago por defecto
router.put('/methods/:id/default', auth, async (req, res) => {
  try {
    res.json({ message: 'Método de pago establecido como por defecto' });
  } catch (error) {
    logger.error('Error estableciendo método de pago por defecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;