const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function tokensMatch(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') {
    return false;
  }

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

/**
 * Token CSRF por sesión (synchronizer token pattern).
 * Se expone en res.locals.csrfToken para los formularios EJS.
 */
function csrfProtection(req, res, next) {
  if (!req.session) {
    return next(new Error('La sesión es obligatoria para la protección CSRF'));
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const received = (req.body && req.body._csrf)
    || req.headers['x-csrf-token']
    || req.headers['x-xsrf-token'];

  if (!tokensMatch(received, req.session.csrfToken)) {
    return res.status(403).render('error', {
      message: 'Solicitud no válida o expirada. Recarga la página e inténtalo nuevamente.'
    });
  }

  return next();
}

module.exports = csrfProtection;
