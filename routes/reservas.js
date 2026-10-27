const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// Mostrar formulario para crear reserva
router.get('/nueva', requireAuth, async (req, res) => {
  try {
    const servicios = await pool.query('SELECT * FROM servicios WHERE activo = true ORDER BY nombre');
    res.render('reservas/nueva', { servicios: servicios.rows, error: null });
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    res.render('reservas/nueva', { servicios: [], error: 'Error al cargar servicios' });
  }
});

// Crear nueva reserva
router.post('/nueva', requireAuth, async (req, res) => {
  try {
    const { servicio_id, fecha, hora } = req.body;
    const usuario_id = req.session.userId;

    if (!servicio_id || !fecha || !hora) {
      const servicios = await pool.query('SELECT * FROM servicios WHERE activo = true');
      return res.render('reservas/nueva', { servicios: servicios.rows, error: 'Todos los campos son obligatorios' });
    }

    // Verificar disponibilidad - consulta parametrizada
    const disponibilidad = await pool.query(
      'SELECT id FROM reservas WHERE fecha = $1 AND hora = $2 AND estado != $3',
      [fecha, hora, 'cancelada']
    );

    if (disponibilidad.rows.length > 0) {
      const servicios = await pool.query('SELECT * FROM servicios WHERE activo = true');
      return res.render('reservas/nueva', { servicios: servicios.rows, error: 'Horario no disponible' });
    }

    // Crear reserva - consulta parametrizada
    await pool.query(
      'INSERT INTO reservas (usuario_id, servicio_id, fecha, hora) VALUES ($1, $2, $3, $4)',
      [usuario_id, servicio_id, fecha, hora]
    );

    res.redirect('/mis-reservas');
  } catch (error) {
    console.error('Error al crear reserva:', error);
    const servicios = await pool.query('SELECT * FROM servicios WHERE activo = true');
    res.render('reservas/nueva', { servicios: servicios.rows, error: 'Error al crear reserva' });
  }
});

// Ver mis reservas
router.get('/mis-reservas', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.fecha, r.hora, r.estado, s.nombre as servicio, s.duracion_minutos
       FROM reservas r
       JOIN servicios s ON r.servicio_id = s.id
       WHERE r.usuario_id = $1
       ORDER BY r.fecha DESC, r.hora DESC`,
      [req.session.userId]
    );
    res.render('reservas/mis-reservas', { reservas: result.rows });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.render('reservas/mis-reservas', { reservas: [], error: 'Error al cargar reservas' });
  }
});

// Cancelar reserva (solo propia)
router.post('/cancelar/:id', requireAuth, async (req, res) => {
  try {
    const reservaId = req.params.id;
    const usuarioId = req.session.userId;

    // Verificar que la reserva pertenece al usuario - consulta parametrizada
    const reserva = await pool.query(
      'SELECT id, estado FROM reservas WHERE id = $1 AND usuario_id = $2',
      [reservaId, usuarioId]
    );

    if (reserva.rows.length === 0) {
      return res.status(403).render('error', { message: 'No tienes permiso para cancelar esta reserva' });
    }

    if (reserva.rows[0].estado === 'cancelada') {
      return res.redirect('/mis-reservas');
    }

    // Cancelar reserva - consulta parametrizada
    await pool.query('UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2', ['cancelada', reservaId]);

    res.redirect('/mis-reservas');
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.redirect('/mis-reservas');
  }
});

module.exports = router;
