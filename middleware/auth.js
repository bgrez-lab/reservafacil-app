function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  if (req.session.rol !== 'admin') {
    return res.status(403).render('error', { 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
}

function requireClient(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  if (req.session.rol !== 'cliente' && req.session.rol !== 'admin') {
    return res.status(403).render('error', { 
      message: 'Acceso denegado.' 
    });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireClient
};
