const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Service = require('../models/Service');
const Reservation = require('../models/Reservation');
const { validateReservation } = require('../utils/validation');

const DEFAULT_SERVICES = [
  { nombre: 'Consulta General', descripcion: 'Atención general', duracionMinutos: 30 },
  { nombre: 'Odontología', descripcion: 'Consulta odontológica', duracionMinutos: 45 },
  { nombre: 'Pediatría', descripcion: 'Atención pediátrica', duracionMinutos: 30 }
];

async function ensureServices() {
  const count = await Service.countDocuments();
  if (count === 0) {
    await Service.insertMany(DEFAULT_SERVICES);
  }
}

router.get('/nueva', requireAuth, async (req, res) => {
  try {
    await ensureServices();
    const servicios = await Service.find({ activo: true }).sort({ nombre: 1 });
    return res.render('reservas/nueva', { servicios, error: null });
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    return res.render('reservas/nueva', { servicios: [], error: 'No se pudieron cargar los servicios. Inténtalo nuevamente.' });
  }
});

router.post('/nueva', requireAuth, async (req, res) => {
  const errors = validateReservation(req.body);
  if (errors.length > 0) {
    await ensureServices();
    const servicios = await Service.find({ activo: true }).sort({ nombre: 1 });
    return res.status(400).render('reservas/nueva', { servicios, error: errors[0] });
  }

  try {
    const service = await Service.findOne({ _id: req.body.servicio_id, activo: true });
    if (!service) {
      await ensureServices();
      const servicios = await Service.find({ activo: true }).sort({ nombre: 1 });
      return res.status(400).render('reservas/nueva', { servicios, error: 'El servicio seleccionado no está disponible' });
    }

    await Reservation.create({
      usuarioId: req.user.sub,
      servicioId: service._id,
      fecha: req.body.fecha,
      hora: req.body.hora
    });

    return res.redirect('/reservas/mis-reservas');
  } catch (error) {
    await ensureServices();
    const servicios = await Service.find({ activo: true }).sort({ nombre: 1 });
    if (error.code === 11000) {
      return res.status(409).render('reservas/nueva', { servicios, error: 'Horario no disponible' });
    }
    console.error('Error al crear reserva:', error);
    return res.status(500).render('reservas/nueva', { servicios, error: 'No se pudo crear la reserva. Inténtalo nuevamente.' });
  }
});

router.get('/mis-reservas', requireAuth, async (req, res) => {
  try {
    const reservas = await Reservation.find({ usuarioId: req.user.sub })
      .populate('servicioId')
      .sort({ fecha: -1, hora: -1 });

    const mapped = reservas.map((r) => ({
      id: r._id,
      fecha: r.fecha,
      hora: r.hora,
      estado: r.estado,
      servicio: r.servicioId ? r.servicioId.nombre : 'Servicio',
      duracion_minutos: r.servicioId ? r.servicioId.duracionMinutos : 0
    }));

    return res.render('reservas/mis-reservas', { reservas: mapped, error: null });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return res.render('reservas/mis-reservas', { reservas: [], error: 'No se pudieron cargar las reservas. Inténtalo nuevamente.' });
  }
});

router.post('/cancelar/:id', requireAuth, async (req, res) => {
  try {
    const reserva = await Reservation.findOne({ _id: req.params.id, usuarioId: req.user.sub });
    if (!reserva) {
      return res.status(403).render('error', { message: 'No tienes permiso para cancelar esta reserva' });
    }
    if (reserva.estado === 'cancelada') {
      return res.redirect('/reservas/mis-reservas');
    }
    reserva.estado = 'cancelada';
    await reserva.save();
    return res.redirect('/reservas/mis-reservas');
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return res.redirect('/reservas/mis-reservas');
  }
});

module.exports = router;
