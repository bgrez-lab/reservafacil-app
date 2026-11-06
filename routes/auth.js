const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { normalizeEmail, validateRegistration, validateLogin } = require('../utils/validation');
const { signToken } = require('../middleware/auth');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

router.get('/registro', (req, res) => {
  if (req.user) {return res.redirect('/');}
  return res.render('registro', { error: null });
});

router.post('/registro', registerLimiter, async (req, res) => {
  try {
    const { nombre, email, password, confirmPassword } = req.body;
    const errors = validateRegistration({ nombre, email, password, confirmPassword });
    if (errors.length > 0) {return res.status(400).render('registro', { error: errors[0] });}

    const normalizedEmail = normalizeEmail(email);
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {return res.status(409).render('registro', { error: 'El email ya está registrado' });}

    const passwordHash = await hashPassword(password);
    const user = await User.create({ nombre: nombre.trim(), email: normalizedEmail, passwordHash, rol: 'usuario' });

    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.redirect('/');
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).render('registro', { error: 'No se pudo completar el registro. Inténtalo nuevamente.' });
  }
});

router.get('/login', (req, res) => {
  if (req.user) {return res.redirect('/');}
  return res.render('login', { error: null });
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = validateLogin({ email, password });
    if (errors.length > 0) {return res.status(400).render('login', { error: 'Email o contraseña inválidos' });}

    const user = await User.findOne({ email: normalizeEmail(email), activo: true });
    if (!user) {return res.status(401).render('login', { error: 'Credenciales inválidas' });}

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {return res.status(401).render('login', { error: 'Credenciales inválidas' });}

    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.redirect('/');
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).render('login', { error: 'No se pudo iniciar sesión. Inténtalo nuevamente.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('csrf_token');
  return res.redirect('/');
});

module.exports = router;
