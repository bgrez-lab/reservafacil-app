const { requireAuth, requireAdmin } = require('../middleware/auth');

function createReq(overrides = {}) {
  return { headers: {}, cookies: {}, ...overrides };
}

function createRes() {
  return {
    statusCode: 200,
    redirected: null,
    rendered: null,
    status(code) { this.statusCode = code; return this; },
    redirect(url) { this.redirected = url; return this; },
    render(view, data) { this.rendered = { view, data }; return this; },
    json(data) { this.jsonData = data; return this; }
  };
}

describe('Middleware de autorización JWT', () => {
  const OLD_SECRET = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret-for-jwt'; });
  afterAll(() => { process.env.JWT_SECRET = OLD_SECRET; });

  test('requireAuth redirige al login sin token', () => {
    const res = createRes();
    requireAuth(createReq(), res, jest.fn());
    expect(res.redirected).toBe('/login');
  });

  test('requireAuth permite tokens válidos', () => {
    const { signToken } = require('../middleware/auth');
    const token = signToken({ _id: '123', rol: 'usuario', email: 'a@b.com', nombre: 'Ana' });
    const res = createRes();
    const next = jest.fn();
    requireAuth(createReq({ cookies: { token } }), res, next);
    expect(next).toHaveBeenCalled();
  });

  test('requireAdmin bloquea usuarios sin rol admin', () => {
    const { signToken } = require('../middleware/auth');
    const token = signToken({ _id: '123', rol: 'usuario', email: 'a@b.com', nombre: 'Ana' });
    const res = createRes();
    requireAdmin(createReq({ cookies: { token } }), res, jest.fn());
    expect(res.statusCode).toBe(403);
  });

  test('requireAdmin permite administradores', () => {
    const { signToken } = require('../middleware/auth');
    const token = signToken({ _id: '1', rol: 'admin', email: 'admin@x.com', nombre: 'Admin' });
    const res = createRes();
    const next = jest.fn();
    requireAdmin(createReq({ cookies: { token } }), res, next);
    expect(next).toHaveBeenCalled();
  });
});
