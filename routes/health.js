const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB no conectado');
    }
    await mongoose.connection.db.admin().ping();
    return res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    console.error('Health check de base de datos falló:', error.message);
    return res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

module.exports = router;
