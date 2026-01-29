const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Endpoint público para pagos - SIN NINGÚN MIDDLEWARE
router.get('/my-payments', auth, async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: 'Recurso no disponible' });
    }
    return res.json({
      payments: [],
      pagination: {
        current: 1,
        pages: 1,
        total: 0
      }
    });
  } catch (error) {
    console.error('❌ [ERROR] Error en /my-payments:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint público para métodos de pago - SIN NINGÚN MIDDLEWARE
router.get('/methods', auth, async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: 'Recurso no disponible' });
    }
    return res.json([]);
  } catch (error) {
    console.error('❌ [ERROR] Error en /methods:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
