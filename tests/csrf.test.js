const csrfProtection = require('../middleware/csrf');

function createRequest(overrides = {}) {
  return {
    method: 'GET',
    body: {},
    headers: {},
    ...overrides
  };
}

function createResponse() {
  const cookies = [];
  const res = {
    locals: {},
    statusCode: 200,
    cookies,
    cookie(name, value, options) {
      cookies.push({ name, value, options });
      return this;
    },
    render: jest.fn(),
    status(code) {
      this.statusCode = code;
      return this;
    }
  };
  return res;
}

describe('Middleware CSRF (double submit cookie)', () => {
  test('genera un token en cookie y lo expone a las vistas', () => {
    const req = createRequest();
    const res = createResponse();

    csrfProtection(req, res, jest.fn());

    expect(res.cookies).toHaveLength(1);
    expect(res.cookies[0].name).toBe('csrf_token');
    expect(res.cookies[0].value).toMatch(/^[a-f0-9]{64}$/);
    expect(res.locals.csrfToken).toBe(res.cookies[0].value);
  });

  test('reutiliza el token existente de la cookie', () => {
    const token = 'a'.repeat(64);
    const req = createRequest({ headers: { cookie: `csrf_token=${token}` } });
    const res = createResponse();

    csrfProtection(req, res, jest.fn());

    expect(res.cookies).toHaveLength(0);
    expect(res.locals.csrfToken).toBe(token);
  });

  test('permite métodos seguros sin validación', () => {
    const next = jest.fn();
    csrfProtection(createRequest({ method: 'GET' }), createResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  test('rechaza POST sin token', () => {
    const token = 'a'.repeat(64);
    const req = createRequest({ method: 'POST', headers: { cookie: `csrf_token=${token}` } });
    const res = createResponse();

    csrfProtection(req, res, jest.fn());

    expect(res.statusCode).toBe(403);
    expect(res.render).toHaveBeenCalled();
  });

  test('rechaza POST con token incorrecto', () => {
    const token = 'a'.repeat(64);
    const req = createRequest({
      method: 'POST',
      body: { _csrf: 'b'.repeat(64) },
      headers: { cookie: `csrf_token=${token}` }
    });
    const res = createResponse();

    csrfProtection(req, res, jest.fn());

    expect(res.statusCode).toBe(403);
  });

  test('acepta POST con token válido por cuerpo o cabecera', () => {
    const token = 'a'.repeat(64);

    const bodyNext = jest.fn();
    const bodyReq = createRequest({
      method: 'POST',
      body: { _csrf: token },
      headers: { cookie: `csrf_token=${token}` }
    });
    csrfProtection(bodyReq, createResponse(), bodyNext);
    expect(bodyNext).toHaveBeenCalled();

    const headerNext = jest.fn();
    const headerReq = createRequest({
      method: 'POST',
      headers: { cookie: `csrf_token=${token}`, 'x-csrf-token': token }
    });
    csrfProtection(headerReq, createResponse(), headerNext);
    expect(headerNext).toHaveBeenCalled();
  });
});
