const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('../db/connection');

async function initDatabase() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Base de datos inicializada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exit(1);
  }
}

initDatabase();
