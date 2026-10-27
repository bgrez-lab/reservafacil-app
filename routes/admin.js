const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { requireAdmin } = require('../middleware/auth');

// Panel de administración
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const totalReservas = await pool.query('SELECT COUNT(*) FROM reservas');
    const reservasPendientes = await pool.query("SELECT COUNT(*) FROM reservas WHERE estado = 'pendiente'");
    const totalUsuarios = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente'");
    const reservasHoy = await pool.query("SELECT COUNT(*) FROM reservas WHERE fecha = CURRENT_DATE");

    res.render('admin/dashboard', {
      totalReservas: totalReservas.rows[0].count,
      reservasPendientes: reservasPendientes.rows[0].count,
      totalUsuarios: totalUsuarios.rows[0].count,
      reservasHoy: reservasHoy.rows[0].count
    });
  } catch (error) {
    console.error('Error en dashboard admin:', error);
    res.render('admin/dashboard', {
      totalReservas: 0,
      reservasPendientes: 0,
      totalUsuarios: 0,
      reservasHoy: 0
    });
  }
});

// Ver todas las reservas
router.get('/reservas', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.fecha, r.hora, r.estado, r.fecha_creacion,
              u.nombre as usuario, u.email,
              s.nombre as servicio
       FROM reservas r
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN servicios s ON r.servicio_id = s.id
       ORDER BY r.fecha DESC, r.hora DESC`
    );
    res.render('admin/reservas', { reservas: result.rows });
  } catch (error) {
    console.error('Error al obtener todas las reservas:', error);
    res.render('admin/reservas', { reservas: [] });
  }
});

// Actualizar estado de reserva
router.post('/reservas/estado/:id', requireAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    const reservaId = req.params.id;

    if (!['pendiente', 'confirmada', 'cancelada', 'completada'].includes(estado)) {
      return res.redirect('/admin/reservas');
    }

    await pool.query(
      'UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2',
      [estado, reservaId]
    );

    res.redirect('/admin/reservas');
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.redirect('/admin/reservas');
  }
});

// Ver usuarios
router.get('/usuarios', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, fecha_registro, activo FROM usuarios ORDER BY fecha_registro DESC'
    );
    res.render('admin/usuarios', { usuarios: result.rows });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.render('admin/usuarios', { usuarios: [] });
  }
});

module.exports = router;
