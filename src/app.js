const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const csrfProtection = require('../middleware/csrf');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Detrás de Render/otros proxies, confiar en X-Forwarded-* para cookies seguras.
if (isProduction) {
  app.set('trust proxy', 1);
}

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS solo se habilita si se configura un origen permitido.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins, credentials: true }));
}

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.static(path.join(__dirname, '../public')));

const sessionSecret = process.env.SESSION_SECRET;
if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
  throw new Error('SESSION_SECRET es obligatorio en producción y debe tener al menos 32 caracteres');
}

let sessionStore;
if (process.env.NODE_ENV !== 'test') {
  const pool = require('../db/connection');
  const PgSession = require('connect-pg-simple')(session);
  sessionStore = new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true
  });
}

// Configuración de sesiones
app.use(session({
  name: 'reservafacil.sid',
  secret: sessionSecret || 'dev-only-secret-change-me',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Protección CSRF para formularios y peticiones que modifican estado.
app.use(csrfProtection);

// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware para pasar datos de sesión a las vistas
app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  res.locals.nombre = req.session.nombre || null;
  res.locals.rol = req.session.rol || null;
  next();
});

// Rutas
const authRoutes = require('../routes/auth');
const reservasRoutes = require('../routes/reservas');
const adminRoutes = require('../routes/admin');
const healthRoutes = require('../routes/health');

app.use('/', authRoutes);
app.use('/reservas', reservasRoutes);
app.use('/admin', adminRoutes);
app.use('/', healthRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'ReservaFácil SpA - Sistema de Reservas' 
  });
});

// Ruta de error
app.use((req, res) => {
  res.status(404).render('error', { message: 'Página no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).render('error', { message: 'Error interno del servidor' });
});

// Iniciar servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
