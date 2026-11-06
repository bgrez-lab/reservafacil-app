const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-only-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), rol: user.rol, email: user.email, nombre: user.nombre },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  if (!token) {return null;}
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies.token) {return req.cookies.token;}
  const auth = req.headers && req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {return auth.slice(7);}
  return null;
}

function requireAuth(req, res, next) {
  const payload = verifyToken(getTokenFromRequest(req));
  if (!payload) {
    const wantsJson = req.headers && /application\/json/.test(req.headers.accept || '');
    if (!wantsJson) {return res.redirect('/login');}
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.locals = res.locals || {};
  req.user = payload;
  res.locals.userId = payload.sub;
  res.locals.nombre = payload.nombre;
  res.locals.rol = payload.rol;
  return next();
}

function requireAdmin(req, res, next) {
  const payload = verifyToken(getTokenFromRequest(req));
  if (!payload) {
    const wantsJson = req.headers && /application\/json/.test(req.headers.accept || '');
    if (!wantsJson) {return res.redirect('/login');}
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (payload.rol !== 'admin') {
    res.locals = res.locals || {};
    return res.status(403).render('error', { message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  res.locals = res.locals || {};
  req.user = payload;
  res.locals.userId = payload.sub;
  res.locals.nombre = payload.nombre;
  res.locals.rol = payload.rol;
  return next();
}

function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  const cookies = {};
  if (!header) {return cookies;}
  header.split(';').forEach((part) => {
    const [key, ...value] = part.trim().split('=');
    if (key) {cookies[key] = decodeURIComponent(value.join('='));}
  });
  return cookies;
}

// Attach cookie parser-like data to req for convenience.
function attachUser(req, res, next) {
  const cookies = parseCookies(req);
  req.cookies = cookies;
  const payload = verifyToken(cookies.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null));
  if (payload) {
    req.user = payload;
    res.locals.userId = payload.sub;
    res.locals.nombre = payload.nombre;
    res.locals.rol = payload.rol;
  } else {
    res.locals.userId = null;
    res.locals.nombre = null;
    res.locals.rol = null;
  }
  return next();
}

module.exports = { signToken, verifyToken, getTokenFromRequest, requireAuth, requireAdmin, attachUser, JWT_SECRET, JWT_EXPIRES_IN };
