const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments({ role: 'client' }),
      Driver.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' })
    ]);

    res.json({
      clients: stats[0],
      drivers: stats[1],
      appointments: stats[2],
      pendingAppointments: stats[3]
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
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
