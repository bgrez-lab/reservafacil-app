const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { hashPassword, comparePassword } = require('../utils/password');

// Mostrar formulario de registro
router.get('/registro', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('registro', { error: null });
});

// Procesar registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, confirmPassword } = req.body;

    if (!nombre || !email || !password || !confirmPassword) {
      return res.render('registro', { error: 'Todos los campos son obligatorios' });
    }

    if (password !== confirmPassword) {
      return res.render('registro', { error: 'Las contraseñas no coinciden' });
    }

    if (password.length < 6) {
      return res.render('registro', { error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el email ya existe - consulta parametrizada
    const emailCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.render('registro', { error: 'El email ya está registrado' });
    }

    // Hash de contraseña
    const passwordHash = await hashPassword(password);

    // Insertar usuario - consulta parametrizada
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, rol',
      [nombre, email, passwordHash, 'cliente']
    );

    const user = result.rows[0];
    req.session.userId = user.id;
    req.session.nombre = user.nombre;
    req.session.rol = user.rol;

    res.redirect('/');
  } catch (error) {
    console.error('Error en registro:', error);
    res.render('registro', { error: 'Error al registrar usuario' });
  }
});

// Mostrar formulario de login
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

// Procesar login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', { error: 'Email y contraseña son obligatorios' });
    }

    // Buscar usuario - consulta parametrizada
    const result = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.render('login', { error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.render('login', { error: 'Usuario desactivado' });
    }

    // Verificar contraseña con bcrypt
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return res.render('login', { error: 'Credenciales inválidas' });
    }

    req.session.userId = user.id;
    req.session.nombre = user.nombre;
    req.session.email = user.email;
    req.session.rol = user.rol;

    res.redirect('/');
  } catch (error) {
    console.error('Error en login:', error);
    res.render('login', { error: 'Error al iniciar sesión' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
