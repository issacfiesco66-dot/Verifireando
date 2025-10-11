const express = require('express');
const Joi = require('joi');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { auth, authorize } = require('../middleware/auth');
const { sendPushNotification, sendWhatsAppMessage } = require('../config/firebase');
const { mockNotifications } = require('../config/mockDatabase');
const logger = require('../utils/logger');

const router = express.Router();

// Esquemas de validación
const sendNotificationSchema = Joi.object({
  recipients: Joi.array().items(Joi.string()).min(1).required(),
  recipientModel: Joi.string().valid('User', 'Driver').required(),
  type: Joi.string().required(),
  channel: Joi.string().valid('push', 'whatsapp', 'both').default('push'),
  title: Joi.string().required().max(100),
  message: Joi.string().required().max(500),
  data: Joi.object().default({}),
  scheduledFor: Joi.date().min('now').optional(),
  template: Joi.string().optional()
});

const markAsReadSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string()).min(1).required()
});

// Función para enviar notificación
async function sendNotificationToRecipient(notification) {
  try {
    let success = false;
    let error = null;

    // Obtener información del destinatario
    const Model = notification.recipientModel === 'User' ? User : Driver;
    const recipient = await Model.findById(notification.recipient);
    
    if (!recipient) {
      throw new Error('Destinatario no encontrado');
    }

    // Enviar notificación push
    if (notification.channel === 'push' || notification.channel === 'both') {
      if (recipient.fcmToken) {
        try {
          await sendPushNotification(
            recipient.fcmToken,
            notification.title,
            notification.message,
            notification.data
          );
          success = true;
          logger.info(`Notificación push enviada a ${recipient.email}`);
        } catch (pushError) {
          logger.error('Error enviando notificación push:', pushError);
          error = pushError.message;
        }
      } else {
        error = 'Token FCM no disponible';
      }
    }

    // Enviar mensaje WhatsApp
    if (notification.channel === 'whatsapp' || notification.channel === 'both') {
      try {
        await sendWhatsAppMessage(recipient.phone, notification.message);
        success = true;
        logger.info(`Mensaje WhatsApp enviado a ${recipient.phone}`);
      } catch (whatsappError) {
        logger.error('Error enviando mensaje WhatsApp:', whatsappError);
        error = whatsappError.message;
      }
    }

    // Actualizar estado de la notificación
    if (success) {
      await notification.markAsSent();
    } else {
      await notification.markAsFailed(error || 'Error desconocido');
    }

    return { success, error };

  } catch (error) {
    logger.error('Error enviando notificación:', error);
    await notification.markAsFailed(error.message);
    return { success: false, error: error.message };
  }
}

// Enviar notificación
router.post('/send', auth, authorize('admin'), async (req, res) => {
  try {
    const { error, value } = sendNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const notifications = [];
    const results = [];

    // Crear notificaciones para cada destinatario
    for (const recipientId of value.recipients) {
      const notification = new Notification({
        recipient: recipientId,
        recipientModel: value.recipientModel,
        type: value.type,
        channel: value.channel,
        title: value.title,
        message: value.message,
        data: value.data,
        scheduledFor: value.scheduledFor,
        template: value.template,
        metadata: {
          sentBy: req.userId,
          sentByName: req.user.name
        }
      });

      await notification.save();
      notifications.push(notification);

      // Enviar inmediatamente si no está programada
      if (!value.scheduledFor) {
        const result = await sendNotificationToRecipient(notification);
        results.push({
          recipientId,
          notificationId: notification._id,
          ...result
        });
      }
    }

    logger.info(`${notifications.length} notificaciones creadas por ${req.user.email}`);

    res.status(201).json({
      message: `${notifications.length} notificaciones ${value.scheduledFor ? 'programadas' : 'enviadas'} exitosamente`,
      notifications: notifications.map(n => ({
        id: n._id,
        recipient: n.recipient,
        status: n.status,
        scheduledFor: n.scheduledFor
      })),
      ...(results.length > 0 && { results })
    });

  } catch (error) {
    logger.error('Error enviando notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener notificaciones del usuario
router.get('/my-notifications', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filter notifications for the current user
    let filteredNotifications = mockNotifications.filter(notification => {
      // Check if notification belongs to current user
      const belongsToUser = notification.recipient === req.userId &&
        notification.recipientModel === (req.userRole === 'driver' ? 'Driver' : 'User');
      
      if (!belongsToUser) return false;
      
      // Apply additional filters
      if (req.query.type && notification.type !== req.query.type) {
        return false;
      }
      
      if (req.query.isRead !== undefined && notification.isRead !== (req.query.isRead === 'true')) {
        return false;
      }
      
      if (req.query.channel && notification.channel !== req.query.channel) {
        return false;
      }
      
      return true;
    });

    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = filteredNotifications.length;
    const notifications = filteredNotifications.slice(skip, skip + limit);
    
    // Count unread notifications
    const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });

  } catch (error) {
    logger.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Marcar notificaciones como leídas
router.put('/mark-as-read', auth, async (req, res) => {
  try {
    const { error, value } = markAsReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: error.details.map(d => d.message) 
      });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: value.notificationIds },
        recipient: req.userId,
        recipientModel: req.userRole === 'driver' ? 'Driver' : 'User'
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      message: `${result.modifiedCount} notificaciones marcadas como leídas`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    logger.error('Error marcando notificaciones como leídas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/mark-all-as-read', auth, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(
      req.userId,
      req.userRole === 'driver' ? 'Driver' : 'User'
    );

    res.json({
      message: `${result.modifiedCount} notificaciones marcadas como leídas`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    logger.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener conteo de notificaciones no leídas
router.get('/unread-count', auth, async (req, res) => {
  try {
    // Count unread notifications for the current user
    const count = mockNotifications.filter(notification => 
      notification.recipient === req.userId &&
      notification.recipientModel === (req.userRole === 'driver' ? 'Driver' : 'User') &&
      !notification.isRead
    ).length;

    res.json({ unreadCount: count });

  } catch (error) {
    logger.error('Error obteniendo conteo de no leídas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar notificación
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.userId,
      recipientModel: req.userRole === 'driver' ? 'Driver' : 'User'
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    await Notification.findByIdAndDelete(id);

    res.json({ message: 'Notificación eliminada exitosamente' });

  } catch (error) {
    logger.error('Error eliminando notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener todas las notificaciones (admin)
router.get('/admin/all', auth, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Filtros
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.channel) {
      filter.channel = req.query.channel;
    }
    
    if (req.query.recipientModel) {
      filter.recipientModel = req.query.recipientModel;
    }
    
    if (req.query.recipient) {
      filter.recipient = req.query.recipient;
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

    const notifications = await Notification.find(filter)
      .populate('recipient', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo notificaciones (admin):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Reenviar notificación fallida (admin)
router.post('/:id/retry', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    if (notification.status !== 'failed') {
      return res.status(400).json({ 
        message: 'Solo se pueden reenviar notificaciones fallidas' 
      });
    }

    // Reintentar envío
    const result = await sendNotificationToRecipient(notification);

    logger.info(`Notificación reenviada: ${notification._id} por ${req.user.email}`);

    res.json({
      message: result.success ? 'Notificación reenviada exitosamente' : 'Error reenviando notificación',
      success: result.success,
      error: result.error
    });

  } catch (error) {
    logger.error('Error reenviando notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de notificaciones (admin)
router.get('/admin/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Estadísticas generales
    const totalNotifications = await Notification.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const sentNotifications = await Notification.countDocuments({
      status: 'sent',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const failedNotifications = await Notification.countDocuments({
      status: 'failed',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Notificaciones por tipo
    const notificationsByType = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          sent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'sent'] }, 1, 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Notificaciones por canal
    const notificationsByChannel = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          sent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'sent'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Notificaciones por día
    const dailyNotifications = await Notification.aggregate([
      {
        $match: {
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
          sent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'sent'] }, 1, 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      period: { startDate, endDate },
      overview: {
        total: totalNotifications,
        sent: sentNotifications,
        failed: failedNotifications,
        successRate: totalNotifications > 0 ? (sentNotifications / totalNotifications * 100).toFixed(1) : 0
      },
      notificationsByType,
      notificationsByChannel: notificationsByChannel.reduce((acc, item) => {
        acc[item._id] = { count: item.count, sent: item.sent };
        return acc;
      }, {}),
      dailyNotifications
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Enviar notificación de prueba (admin)
router.post('/admin/test', auth, authorize('admin'), async (req, res) => {
  try {
    const { recipientId, recipientModel, channel } = req.body;

    if (!recipientId || !recipientModel || !channel) {
      return res.status(400).json({ 
        message: 'recipientId, recipientModel y channel son requeridos' 
      });
    }

    const notification = new Notification({
      recipient: recipientId,
      recipientModel,
      type: 'test',
      channel,
      title: 'Notificación de Prueba',
      message: 'Esta es una notificación de prueba enviada desde el panel de administración.',
      data: {
        test: true,
        sentBy: req.user.name,
        timestamp: new Date()
      },
      metadata: {
        sentBy: req.userId,
        sentByName: req.user.name,
        isTest: true
      }
    });

    await notification.save();

    const result = await sendNotificationToRecipient(notification);

    res.json({
      message: result.success ? 'Notificación de prueba enviada exitosamente' : 'Error enviando notificación de prueba',
      notification: {
        id: notification._id,
        status: notification.status
      },
      result
    });

  } catch (error) {
    logger.error('Error enviando notificación de prueba:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint para suscribirse a notificaciones push
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;

    if (!subscription) {
      return res.status(400).json({ message: 'Suscripción requerida' });
    }

    // Determinar el modelo basado en el rol del usuario
    const Model = req.user.role === 'driver' ? Driver : User;
    
    // Actualizar el usuario con la información de suscripción push
    await Model.findByIdAndUpdate(req.user.id, {
      pushSubscription: subscription,
      userAgent: userAgent,
      lastPushSubscriptionUpdate: new Date()
    });

    logger.info(`Suscripción push actualizada para ${req.user.role}: ${req.user.id}`);

    res.status(200).json({ 
      message: 'Suscripción push registrada exitosamente',
      success: true 
    });

  } catch (error) {
    logger.error('Error registrando suscripción push:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;