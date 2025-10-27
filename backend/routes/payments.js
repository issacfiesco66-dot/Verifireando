const express = require('express');
const Joi = require('joi');
let stripe = null;
const logger = require('../utils/logger');
const stripeKey = process.env.STRIPE_SECRET_KEY;
try {
  if (stripeKey) {
    // Inicialización perezosa y segura de Stripe
    // Evita que la app caiga si la clave no está configurada
    // o si require('stripe') falla en arranque
    stripe = require('stripe')(stripeKey);
    logger.info('Stripe inicializado correctamente');
  } else {
    logger.warn('Stripe no configurado (STRIPE_SECRET_KEY ausente); endpoints de tarjeta limitados');
  }
} catch (e) {
  logger.error('Error inicializando Stripe:', e);
  stripe = null;
}
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Esquemas de validación
const createPaymentIntentSchema = Joi.object({
  appointmentId: Joi.string().required(),
  paymentMethod: Joi.string().valid('card', 'cash').default('card'),
  currency: Joi.string().valid('mxn', 'usd').default('mxn')
});

const confirmPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required(),
  paymentMethodId: Joi.string().when('paymentMethod', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  paymentMethod: Joi.string().valid('card', 'cash').required()
});

const refundSchema = Joi.object({
  amount: Joi.number().min(0).optional(),
  reason: Joi.string().valid('duplicate', 'fraudulent', 'requested_by_customer').default('requested_by_customer'),
  notes: Joi.string().max(500).allow('')
});

// Crear Payment Intent
router.post('/create-intent', auth, async (req, res) => {
  try {
    const { error, value } = createPaymentIntentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

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
    const subtotal = appointment.pricing.basePrice + 
                    appointment.pricing.additionalServices.reduce((sum, service) => sum + service.price, 0);
    const taxes = Math.round(subtotal * 0.16); // 16% IVA
    const total = subtotal + taxes;

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
          amount: total * 100, // Stripe usa centavos
          currency: value.currency,
          metadata: {
            appointmentId: appointment._id.toString(),
            appointmentNumber: appointment.appointmentNumber,
            clientId: appointment.client._id.toString(),
            clientEmail: appointment.client.email
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
        taxes,
        total
      },
      currency: value.currency,
      method: value.paymentMethod,
      provider: value.paymentMethod === 'card' ? 'stripe' : 'cash',
      status: 'pending',
      stripePaymentIntentId,
      paymentDetails: {
        description: `Verificación vehicular - ${appointment.car.plates}`,
        metadata: {
          appointmentNumber: appointment.appointmentNumber,
          carPlates: appointment.car.plates,
          carInfo: `${appointment.car.brand} ${appointment.car.model}`
        }
      }
    });

    // Calcular comisiones
    payment.calculateFees();
    await payment.save();

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
        status: payment.status
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

// Confirmar pago
router.post('/confirm', auth, async (req, res) => {
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
        { stripePaymentIntentId: value.paymentIntentId }
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

    // Verificar permisos
    if (payment.appointment.client._id.toString() !== req.userId) {
      return res.status(403).json({ 
        message: 'No tienes permisos para confirmar este pago' 
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Este pago ya ha sido procesado' 
      });
    }

    if (value.paymentMethod === 'card') {
      if (!stripe) {
        return res.status(503).json({ 
          message: 'Pago con tarjeta no disponible: Stripe no está configurado' 
        });
      }
      try {
        // Confirmar pago en Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Actualizar información del pago
          payment.status = 'completed';
          payment.paymentDetails.cardInfo = {
            last4: paymentIntent.charges.data[0]?.payment_method_details?.card?.last4,
            brand: paymentIntent.charges.data[0]?.payment_method_details?.card?.brand,
            expiryMonth: paymentIntent.charges.data[0]?.payment_method_details?.card?.exp_month,
            expiryYear: paymentIntent.charges.data[0]?.payment_method_details?.card?.exp_year
          };
          payment.paymentDetails.transactionId = paymentIntent.charges.data[0]?.id;
          payment.stripeChargeId = paymentIntent.charges.data[0]?.id;
        } else {
          return res.status(400).json({ 
            message: 'El pago no pudo ser procesado' 
          });
        }
      } catch (stripeError) {
        logger.error('Error confirmando pago en Stripe:', stripeError);
        return res.status(500).json({ 
          message: 'Error procesando el pago' 
        });
      }
    } else {
      // Pago en efectivo
      payment.status = 'completed';
      payment.paymentDetails.transactionId = `CASH_${Date.now()}`;
    }

    await payment.updateStatus('completed', 'Pago confirmado exitosamente');
    await payment.save();

    // Generar recibo
    const receipt = await payment.generateReceipt();

    // Enviar notificación
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

    logger.info(`Pago confirmado: ${payment.paymentNumber} por ${req.user.email}`);

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
          stripePaymentIntentId: paymentIntent.id
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
          stripePaymentIntentId: failedPayment.id
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
    
    if (refundAmount > payment.getRefundableAmount()) {
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

module.exports = router;