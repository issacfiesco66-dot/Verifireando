const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/services - Obtener todos los servicios activos
router.get('/', async (req, res) => {
  try {
    const { category, popular } = req.query;
    let services;

    if (popular === 'true') {
      services = await Service.getPopular(parseInt(req.query.limit) || 5);
    } else if (category) {
      services = await Service.getByCategory(category);
    } else {
      services = await Service.find({ isActive: true }).sort({ category: 1, basePrice: 1 });
    }

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    logger.error('Error al obtener servicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/services/:id - Obtener un servicio específico
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/services - Crear nuevo servicio (solo admin)
router.post('/', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear servicios'
      });
    }

    const service = new Service(req.body);
    await service.save();

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: service
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de servicio inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un servicio con ese código o nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/services/:id - Actualizar servicio (solo admin)
router.put('/:id', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar servicios'
      });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: service
    });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de servicio inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/services/:id - Eliminar servicio (solo admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar servicios'
      });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Servicio desactivado exitosamente',
      data: service
    });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/services/categories/list - Obtener categorías disponibles
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Service.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/services/:id/book - Incrementar contador de reservas
router.post('/:id/book', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { 
          'metadata.totalBookings': 1,
          'metadata.popularity': 1
        }
      },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estadísticas actualizadas',
      data: service
    });
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;