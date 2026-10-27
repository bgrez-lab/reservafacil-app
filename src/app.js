const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

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

app.use('/', authRoutes);
app.use('/reservas', reservasRoutes);
app.use('/admin', adminRoutes);

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
  console.error(err.stack);
  res.status(500).render('error', { message: 'Error interno del servidor' });
});

// Iniciar servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
