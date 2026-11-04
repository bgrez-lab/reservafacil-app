const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { requireAuth } = require('../middleware/auth');
const { validateReservation } = require('../utils/validation');

async function getActiveServices() {
  const result = await pool.query('SELECT * FROM servicios WHERE activo = true ORDER BY nombre');
  return result.rows;
}

async function renderNewReservation(res, status, error) {
  let servicios = [];
  try {
    servicios = await getActiveServices();
  } catch (dbError) {
    console.error('Error al cargar servicios:', dbError);
  }

  return res.status(status).render('reservas/nueva', { servicios, error });
}

// Mostrar formulario para crear reserva
router.get('/nueva', requireAuth, async (req, res) => {
  try {
    const servicios = await getActiveServices();
    return res.render('reservas/nueva', { servicios, error: null });
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    return res.render('reservas/nueva', {
      servicios: [],
      error: 'No se pudieron cargar los servicios. Inténtalo nuevamente.'
    });
  }
});

// Crear nueva reserva
router.post('/nueva', requireAuth, async (req, res) => {
  const { servicio_id: servicioId, fecha, hora } = req.body;

  const validationErrors = validateReservation({
    servicio_id: servicioId,
    fecha,
    hora
  });

  if (validationErrors.length > 0) {
    return renderNewReservation(res, 400, validationErrors[0]);
  }

  try {
    const service = await pool.query(
      'SELECT id FROM servicios WHERE id = $1 AND activo = true',
      [servicioId]
    );

    if (service.rows.length === 0) {
      return renderNewReservation(res, 400, 'El servicio seleccionado no está disponible');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // La restricción única parcial de la base de datos es la última defensa
      // frente a dos solicitudes simultáneas para el mismo horario.
      const disponibilidad = await client.query(
        "SELECT id FROM reservas WHERE fecha = $1 AND hora = $2 AND estado <> 'cancelada' FOR UPDATE",
        [fecha, hora]
      );

      if (disponibilidad.rows.length > 0) {
        await client.query('ROLLBACK');
        return renderNewReservation(res, 409, 'Horario no disponible');
      }

      await client.query(
        'INSERT INTO reservas (usuario_id, servicio_id, fecha, hora) VALUES ($1, $2, $3, $4)',
        [req.session.userId, servicioId, fecha, hora]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.redirect('/reservas/mis-reservas');
  } catch (error) {
    if (error.code === '23505') {
      return renderNewReservation(res, 409, 'Horario no disponible');
    }

    console.error('Error al crear reserva:', error);
    return renderNewReservation(res, 500, 'No se pudo crear la reserva. Inténtalo nuevamente.');
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
    return res.render('reservas/mis-reservas', { reservas: result.rows });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return res.render('reservas/mis-reservas', {
      reservas: [],
      error: 'No se pudieron cargar las reservas. Inténtalo nuevamente.'
    });
  }
});

// Cancelar reserva (solo propia)
router.post('/cancelar/:id', requireAuth, async (req, res) => {
  try {
    const reservaId = req.params.id;
    const usuarioId = req.session.userId;

    if (!/^\d+$/.test(reservaId)) {
      return res.status(400).render('error', { message: 'Reserva no válida' });
    }

    // Verificar que la reserva pertenece al usuario - consulta parametrizada
    const reserva = await pool.query(
      'SELECT id, estado FROM reservas WHERE id = $1 AND usuario_id = $2',
      [reservaId, usuarioId]
    );

    if (reserva.rows.length === 0) {
      return res.status(403).render('error', {
        message: 'No tienes permiso para cancelar esta reserva'
      });
    }

    if (reserva.rows[0].estado === 'cancelada') {
      return res.redirect('/reservas/mis-reservas');
    }

    // Cancelar reserva - consulta parametrizada
    await pool.query(
      'UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelada', reservaId]
    );

    return res.redirect('/reservas/mis-reservas');
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return res.redirect('/reservas/mis-reservas');
  }
});

module.exports = router;
