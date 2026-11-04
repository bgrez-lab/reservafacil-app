const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db: 'connected', time: result.rows[0].now });
  } catch (error) {
    console.error('Health check de base de datos falló:', error.message);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

module.exports = router;
