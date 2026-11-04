const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../db/connection');
const { hashPassword, comparePassword } = require('../utils/password');
const {
  normalizeEmail,
  validateRegistration,
  validateLogin
} = require('../utils/validation');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos de inicio de sesión. Espera 15 minutos antes de reintentar.'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados registros desde esta dirección. Espera antes de reintentar.'
});

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

async function startAuthenticatedSession(req, user) {
  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.nombre = user.nombre;
  req.session.email = user.email;
  req.session.rol = user.rol;
  await saveSession(req);
}

// Mostrar formulario de registro
router.get('/registro', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  return res.render('registro', { error: null });
});

// Procesar registro
router.post('/registro', registerLimiter, async (req, res) => {
  try {
    const { nombre, email, password, confirmPassword } = req.body;
    const errors = validateRegistration({ nombre, email, password, confirmPassword });

    if (errors.length > 0) {
      return res.status(400).render('registro', { error: errors[0] });
    }

    const normalizedEmail = normalizeEmail(email);

    // Verificar si el email ya existe - consulta parametrizada
    const emailCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).render('registro', { error: 'El email ya está registrado' });
    }

    const passwordHash = await hashPassword(password);

    // Insertar usuario - consulta parametrizada
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre.trim(), normalizedEmail, passwordHash, 'cliente']
    );

    await startAuthenticatedSession(req, result.rows[0]);

    return res.redirect('/');
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).render('registro', {
      error: 'No se pudo completar el registro. Inténtalo nuevamente.'
    });
  }
});

// Mostrar formulario de login
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  return res.render('login', { error: null });
});

// Procesar login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = validateLogin({ email, password });

    if (errors.length > 0) {
      return res.status(400).render('login', { error: 'Email o contraseña inválidos' });
    }

    // Buscar usuario - consulta parametrizada
    const result = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1',
      [normalizeEmail(email)]
    );

    if (result.rows.length === 0) {
      return res.status(401).render('login', { error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // No revelar si la cuenta existe pero está desactivada.
    if (!user.activo) {
      return res.status(401).render('login', { error: 'Credenciales inválidas' });
    }

    // Verificar contraseña con bcrypt
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).render('login', { error: 'Credenciales inválidas' });
    }

    await startAuthenticatedSession(req, user);

    return res.redirect('/');
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).render('login', {
      error: 'No se pudo iniciar sesión. Inténtalo nuevamente.'
    });
  }
});

// Logout (POST para evitar cierre de sesión por CSRF)
router.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error);
    }
    res.clearCookie('reservafacil.sid');
    res.redirect('/');
  });
});

module.exports = router;
