const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE = 'csrf_token';

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

function tokensMatch(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') {return false;}
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function csrfProtection(req, res, next) {
  const cookies = parseCookies(req);
  let token = cookies[CSRF_COOKIE];

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });
  }

  res.locals.csrfToken = token;

  if (SAFE_METHODS.has(req.method)) {return next();}

  const received = (req.body && req.body._csrf)
    || req.headers['x-csrf-token']
    || req.headers['x-xsrf-token'];

  if (!tokensMatch(received, token)) {
    return res.status(403).render('error', {
      message: 'Solicitud no válida o expirada. Recarga la página e inténtalo nuevamente.'
    });
  }

  return next();
}

module.exports = csrfProtection;
module.exports.CSRF_COOKIE = CSRF_COOKIE;
