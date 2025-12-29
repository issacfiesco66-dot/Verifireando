const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Driver = require('./models/Driver');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());

// Debug endpoint para verificar usuarios
app.get('/debug/users', async (req, res) => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verifireando');
    console.log('Conectado exitosamente');
    
    // Contar usuarios
    const userCount = await User.countDocuments();
    const driverCount = await Driver.countDocuments();
    
    console.log(`Usuarios en User: ${userCount}`);
    console.log(`Usuarios en Driver: ${driverCount}`);
    
    // Buscar cliente específico
    const clientUser = await User.findOne({ email: 'cliente@test.com' });
    console.log('Cliente encontrado:', clientUser);
    
    // Listar todos los usuarios
    const allUsers = await User.find({});
    const allDrivers = await Driver.find({});
    
    res.json({
      totalUsers: userCount,
      totalDrivers: driverCount,
      clientFound: !!clientUser,
      users: allUsers.map(u => ({
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        isVerified: u.isVerified
      })),
      drivers: allDrivers.map(d => ({
        email: d.email,
        role: d.role,
        isActive: d.isActive,
        isVerified: d.isVerified
      }))
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
});
