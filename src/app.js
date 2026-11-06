const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const csrfProtection = require('../middleware/csrf');
const { attachUser } = require('../middleware/auth');
const { connectDatabase } = require('../db/connection');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

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

app.use(attachUser);
app.use(csrfProtection);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use((req, res, next) => {
  if (!res.locals.userId) {
    res.locals.userId = null;
    res.locals.nombre = null;
    res.locals.rol = null;
  }
  next();
});

const authRoutes = require('../routes/auth');
const reservasRoutes = require('../routes/reservas');
const adminRoutes = require('../routes/admin');
const contactRoutes = require('../routes/contact');
const socialRoutes = require('../routes/social');
const chatbotRoutes = require('../routes/chatbot');
const healthRoutes = require('../routes/health');

app.use('/', authRoutes);
app.use('/reservas', reservasRoutes);
app.use('/admin', adminRoutes);
app.use('/contacto', contactRoutes);
app.use('/social', socialRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/', healthRoutes);

app.get('/', (req, res) => {
  res.render('index', { title: 'ReservaFácil SpA - Sistema de Reservas' });
});

app.use((req, res) => {
  res.status(404).render('error', { message: 'Página no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) {return next(err);}
  res.status(500).render('error', { message: 'Error interno del servidor' });
});

if (require.main === module) {
  const start = async () => {
    try {
      if (process.env.NODE_ENV !== 'test') {
        await connectDatabase();
      }
      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('No se pudo iniciar la aplicación:', error.message);
      process.exit(1);
    }
  };
  start();
}

module.exports = app;
