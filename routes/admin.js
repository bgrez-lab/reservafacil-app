const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Reservation = require('../models/Reservation');

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const totalReservas = await Reservation.countDocuments();
    const reservasPendientes = await Reservation.countDocuments({ estado: 'pendiente' });
    const totalUsuarios = await User.countDocuments({ rol: 'usuario' });
    const hoy = new Date().toISOString().slice(0, 10);
    const reservasHoy = await Reservation.countDocuments({ fecha: hoy });

    return res.render('admin/dashboard', { totalReservas, reservasPendientes, totalUsuarios, reservasHoy });
  } catch (error) {
    console.error('Error en dashboard admin:', error);
    return res.render('admin/dashboard', { totalReservas: 0, reservasPendientes: 0, totalUsuarios: 0, reservasHoy: 0 });
  }
});

router.get('/reservas', requireAdmin, async (req, res) => {
  try {
    const reservas = await Reservation.find().populate('usuarioId').populate('servicioId').sort({ fecha: -1, hora: -1 });
    const mapped = reservas.map((r) => ({
      id: r._id,
      fecha: r.fecha,
      hora: r.hora,
      estado: r.estado,
      usuario: r.usuarioId ? r.usuarioId.nombre : 'Desconocido',
      email: r.usuarioId ? r.usuarioId.email : '',
      servicio: r.servicioId ? r.servicioId.nombre : 'Servicio'
    }));
    return res.render('admin/reservas', { reservas: mapped });
  } catch (error) {
    console.error('Error al obtener todas las reservas:', error);
    return res.render('admin/reservas', { reservas: [] });
  }
});

router.post('/reservas/estado/:id', requireAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['pendiente', 'confirmada', 'cancelada', 'completada'].includes(estado)) {
      return res.status(400).render('error', { message: 'Estado no válido' });
    }
    await Reservation.findByIdAndUpdate(req.params.id, { estado });
    return res.redirect('/admin/reservas');
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return res.redirect('/admin/reservas');
  }
});

router.get('/usuarios', requireAdmin, async (req, res) => {
  try {
    const usuarios = await User.find().sort({ fechaRegistro: -1 });
    const mapped = usuarios.map((u) => ({
      id: u._id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      fecha_registro: u.fechaRegistro,
      activo: u.activo
    }));
    return res.render('admin/usuarios', { usuarios: mapped });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.render('admin/usuarios', { usuarios: [] });
  }
});

module.exports = router;
