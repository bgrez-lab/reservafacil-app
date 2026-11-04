const { requireAuth, requireAdmin, requireClient } = require('../middleware/auth');

function createResponse() {
  return {
    statusCode: 200,
    render: jest.fn(),
    redirect: jest.fn(),
    status(code) {
      this.statusCode = code;
      return this;
    }
  };
}

describe('Middleware de autorización', () => {
  test('requireAuth redirige al login sin sesión', () => {
    const res = createResponse();
    requireAuth({ session: {} }, res, jest.fn());
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });

  test('requireAuth permite usuarios autenticados', () => {
    const next = jest.fn();
    requireAuth({ session: { userId: 1 } }, createResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  test('requireAdmin redirige sin sesión', () => {
    const res = createResponse();
    requireAdmin({ session: null }, res, jest.fn());
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });

  test('requireAdmin bloquea a clientes', () => {
    const res = createResponse();
    requireAdmin({ session: { userId: 2, rol: 'cliente' } }, res, jest.fn());
    expect(res.statusCode).toBe(403);
    expect(res.render).toHaveBeenCalledWith('error', expect.any(Object));
  });

  test('requireAdmin permite administradores', () => {
    const next = jest.fn();
    requireAdmin({ session: { userId: 1, rol: 'admin' } }, createResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  test('requireClient permite cliente y admin, bloquea otros roles', () => {
    const clientNext = jest.fn();
    requireClient({ session: { userId: 2, rol: 'cliente' } }, createResponse(), clientNext);
    expect(clientNext).toHaveBeenCalled();

    const adminNext = jest.fn();
    requireClient({ session: { userId: 1, rol: 'admin' } }, createResponse(), adminNext);
    expect(adminNext).toHaveBeenCalled();

    const res = createResponse();
    requireClient({ session: { userId: 3, rol: 'otro' } }, res, jest.fn());
    expect(res.statusCode).toBe(403);
  });
});
