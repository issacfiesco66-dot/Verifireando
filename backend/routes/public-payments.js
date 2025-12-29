const express = require('express');
const router = express.Router();

// Endpoint público para pagos - SIN NINGÚN MIDDLEWARE
router.get('/my-payments', async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint público /my-payments llamado');
  try {
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
          subtotal: 1500,
          discount: 0,
          taxes: 240,
          total: 1740
        },
        status: 'completed',
        method: 'card',
        createdAt: new Date('2025-12-20'),
        description: 'Verificación básica'
      },
      {
        _id: 'pay_2',
        appointment: {
          appointmentNumber: 'APT-002',
          scheduledDate: new Date('2025-12-22'),
          status: 'completed'
        },
        paymentNumber: 'PAY-002',
        amount: {
          subtotal: 2000,
          discount: 200,
          taxes: 288,
          total: 2088
        },
        status: 'completed',
        method: 'cash',
        createdAt: new Date('2025-12-22'),
        description: 'Verificación completa'
      }
    ];

    res.json({
      payments: mockPayments,
      pagination: {
        current: 1,
        pages: 1,
        total: mockPayments.length
      }
    });
  } catch (error) {
    console.error('❌ [ERROR] Error en /my-payments:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint público para métodos de pago - SIN NINGÚN MIDDLEWARE
router.get('/methods', async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint público /methods llamado');
  try {
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

    res.json(mockPaymentMethods);
  } catch (error) {
    console.error('❌ [ERROR] Error en /methods:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
