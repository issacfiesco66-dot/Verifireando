const express = require('express');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// Solo disponible en desarrollo
if (process.env.NODE_ENV !== 'development') {
  module.exports = router;
  return;
}

// Verificar usuario manualmente (solo desarrollo)
router.post('/verify-user', async (req, res) => {
  try {
    const { email, role = 'client' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    logger.info(`Usuario verificado manualmente (dev): ${email}`);

    res.json({
      message: 'Usuario verificado exitosamente',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isVerified: true
      }
    });

  } catch (error) {
    logger.error('Error verificando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Listar usuarios no verificados
router.get('/unverified-users', async (req, res) => {
  try {
    const clients = await User.find({ isVerified: false, role: 'client' })
      .select('name email phone createdAt')
      .sort({ createdAt: -1 });

    const drivers = await User.find({ isVerified: false, role: 'driver' })
      .select('name email phone createdAt')
      .sort({ createdAt: -1 });

    res.json({
      clients: clients,
      drivers: drivers
    });

  } catch (error) {
    logger.error('Error obteniendo usuarios no verificados:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
