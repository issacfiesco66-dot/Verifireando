const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Car = require('../models/Car');
const logger = require('../utils/logger');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, newUsersToday,
           totalDrivers, onlineDrivers,
           totalAppointments, todayAppointments, pendingAppointments, completedAppointments,
           totalRevenue, todayRevenue, monthRevenue,
           totalCars] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'client', isActive: true }),
      User.countDocuments({ role: 'client', createdAt: { $gte: startOfToday } }),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'driver', isOnline: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ scheduledDate: { $gte: startOfToday } }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: { $in: ['completed', 'delivered'] } }),
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount.total' } } }]),
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: '$amount.total' } } }]),
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount.total' } } }]),
      Car.countDocuments()
    ]);

    res.json({
      users: { total: totalUsers, active: activeUsers, new: newUsersToday },
      drivers: { total: totalDrivers, active: totalDrivers, online: onlineDrivers },
      appointments: { total: totalAppointments, today: todayAppointments, pending: pendingAppointments, completed: completedAppointments },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0
      },
      cars: { total: totalCars, verified: totalCars, pending: 0 }
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// Get recent activity
router.get('/recent-activity', auth, authorize('admin'), async (req, res) => {
  try {
    const recentAppointments = await Appointment.find()
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activity = recentAppointments.map(appt => ({
      type: appt.status === 'completed' ? 'payment_completed' : 'appointment_created',
      data: {
        clientName: appt.client?.name || 'Cliente',
        amount: appt.totalAmount || 0,
        appointmentNumber: appt.appointmentNumber
      },
      createdAt: appt.createdAt
    }));

    res.json(activity);
  } catch (error) {
    logger.error('Error getting recent activity:', error);
    res.status(500).json({ message: 'Error al obtener actividad reciente' });
  }
});

// Get top drivers
router.get('/top-drivers', auth, authorize('admin'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isActive: true })
      .select('name driverProfile.rating driverProfile.totalTrips isOnline')
      .sort({ 'driverProfile.totalTrips': -1 })
      .limit(5)
      .lean();

    const result = drivers.map(d => ({
      _id: d._id,
      name: d.name,
      rating: d.driverProfile?.rating || 0,
      completedAppointments: d.driverProfile?.totalTrips || 0,
      isOnline: d.isOnline
    }));

    res.json(result);
  } catch (error) {
    logger.error('Error getting top drivers:', error);
    res.status(500).json({ message: 'Error al obtener conductores' });
  }
});

// Get settings
router.get('/settings', auth, authorize('admin'), async (req, res) => {
  try {
    // Settings básicos del sistema
    const settings = {
      siteName: 'Verifireando',
      version: '1.0.0',
      maintenance: false,
      allowRegistrations: true,
      emailNotifications: true,
      pushNotifications: true,
      whatsappNotifications: false,
      maxAppointmentsPerDay: 10,
      appointmentCancellationHours: 24,
      autoApproveDrivers: false,
      requireDriverVerification: true
    };

    res.json(settings);
  } catch (error) {
    logger.error('Error getting settings:', error);
    res.status(500).json({ message: 'Error al obtener configuración' });
  }
});

// Update settings
router.put('/settings', auth, authorize('admin'), async (req, res) => {
  try {
    const settings = req.body;
    
    // Aquí podrías guardar los settings en la base de datos
    // Por ahora solo los devolvemos como confirmación
    logger.info('Settings updated by admin:', req.user.email);
    
    res.json({
      message: 'Configuración actualizada',
      settings
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error al actualizar configuración' });
  }
});

// Get all users (admin view)
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Get all drivers (admin view)
router.get('/drivers', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = {};
    
    if (status === 'online') query.isOnline = true;
    if (status === 'offline') query.isOnline = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const drivers = await Driver.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Driver.countDocuments(query);

    res.json({
      drivers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting drivers:', error);
    res.status(500).json({ message: 'Error al obtener conductores' });
  }
});

// Get all appointments (admin view)
router.get('/appointments', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'name email phone')
      .populate('driver', 'name email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting appointments:', error);
    res.status(500).json({ message: 'Error al obtener citas' });
  }
});

// Get reports
router.get('/reports', auth, authorize('admin'), async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    // Aquí podrías generar diferentes tipos de reportes
    // Por ahora devolvemos datos de ejemplo
    const reports = {
      appointments: [],
      revenue: [],
      users: []
    };

    res.json(reports);
  } catch (error) {
    logger.error('Error getting reports:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
});

module.exports = router;
