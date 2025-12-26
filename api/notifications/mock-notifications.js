// Mock notifications API for development
const jwt = require('jsonwebtoken');

// Mock notifications data
const mockNotifications = [
  {
    _id: '1',
    recipient: 'user123',
    recipientModel: 'User',
    type: 'appointment_reminder',
    title: 'Recordatorio de Cita',
    message: 'Tu cita de verificación está programada para mañana a las 10:00 AM',
    data: {
      appointmentId: 'apt123',
      time: '10:00 AM',
      date: '2024-01-15'
    },
    isRead: false,
    status: 'sent',
    channel: 'push',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    _id: '2',
    recipient: 'user123',
    recipientModel: 'User',
    type: 'appointment_confirmed',
    title: 'Cita Confirmada',
    message: 'Tu cita de verificación ha sido confirmada para el 15 de enero a las 10:00 AM',
    data: {
      appointmentId: 'apt123',
      confirmationNumber: 'VER-2024-001'
    },
    isRead: true,
    status: 'sent',
    channel: 'push',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
  },
  {
    _id: '3',
    recipient: 'user123',
    recipientModel: 'User',
    type: 'payment_received',
    title: 'Pago Recibido',
    message: 'Hemos recibido tu pago de $500.00 para la verificación vehicular',
    data: {
      paymentId: 'pay123',
      amount: 500.00,
      currency: 'MXN'
    },
    isRead: false,
    status: 'sent',
    channel: 'push',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    _id: '4',
    recipient: 'driver456',
    recipientModel: 'Driver',
    type: 'new_appointment',
    title: 'Nueva Cita Disponible',
    message: 'Hay una nueva cita de verificación disponible en tu zona',
    data: {
      appointmentId: 'apt124',
      location: 'Zona Norte',
      estimatedEarnings: 150.00
    },
    isRead: false,
    status: 'sent',
    channel: 'push',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  }
];

// Helper function to extract user from token
function getUserFromToken(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return null;
    }
    
    // For mock purposes, we'll use a simple token structure
    if (token === 'test-token') {
      return { id: 'user123', role: 'client' };
    }
    
    // Try to decode JWT (for real tokens)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      return decoded;
    } catch {
      // If JWT fails, return mock user for development
      return { id: 'user123', role: 'client' };
    }
  } catch (error) {
    return null;
  }
}

// Get user's notifications
const getMyNotifications = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      });
    }

    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type;

    // Filter notifications for the current user
    let filteredNotifications = mockNotifications.filter(notification => {
      // Match recipient
      if (notification.recipient !== user.id) return false;
      
      // Match recipient model based on user role
      const expectedModel = user.role === 'driver' ? 'Driver' : 'User';
      if (notification.recipientModel !== expectedModel) return false;
      
      // Filter by unread only
      if (unreadOnly && notification.isRead) return false;
      
      // Filter by type
      if (type && notification.type !== type) return false;
      
      return true;
    });

    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const skip = (page - 1) * limit;
    const total = filteredNotifications.length;
    const notifications = filteredNotifications.slice(skip, skip + limit);

    // Count unread notifications
    const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
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
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      });
    }

    const { notificationId } = req.params;
    
    // Find and update notification
    const notification = mockNotifications.find(n => 
      n._id === notificationId && n.recipient === user.id
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    notification.isRead = true;
    notification.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      });
    }

    // Update all user's notifications
    const expectedModel = user.role === 'driver' ? 'Driver' : 'User';
    const updatedCount = mockNotifications.filter(n => 
      n.recipient === user.id && 
      n.recipientModel === expectedModel && 
      !n.isRead
    ).length;
    
    mockNotifications.forEach(notification => {
      if (notification.recipient === user.id && 
          notification.recipientModel === expectedModel && 
          !notification.isRead) {
        notification.isRead = true;
        notification.updatedAt = new Date();
      }
    });

    res.json({
      success: true,
      message: `${updatedCount} notificaciones marcadas como leídas`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      });
    }

    const expectedModel = user.role === 'driver' ? 'Driver' : 'User';
    const count = mockNotifications.filter(notification =>
      notification.recipient === user.id &&
      notification.recipientModel === expectedModel &&
      !notification.isRead
    ).length;

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};