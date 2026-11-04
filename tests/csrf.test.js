const csrfProtection = require('../middleware/csrf');

function createRequest(overrides = {}) {
  return {
    method: 'GET',
    body: {},
    headers: {},
    session: {},
    ...overrides
  };
}

function createResponse() {
  return {
    locals: {},
    statusCode: 200,
    render: jest.fn(),
    status(code) {
      this.statusCode = code;
      return this;
    }
  };
}

describe('Middleware CSRF', () => {
  test('genera un token y lo expone a las vistas', () => {
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.session.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(res.locals.csrfToken).toBe(req.session.csrfToken);
  });

  test('reutiliza el token existente de la sesión', () => {
    const req = createRequest({ session: { csrfToken: 'a'.repeat(64) } });
    const res = createResponse();

    csrfProtection(req, res, jest.fn());

    expect(req.session.csrfToken).toBe('a'.repeat(64));
  });

  test('permite métodos seguros sin token', () => {
    const next = jest.fn();
    csrfProtection(createRequest({ method: 'GET' }), createResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  test('rechaza POST sin token', () => {
    const req = createRequest({ method: 'POST', session: { csrfToken: 'a'.repeat(64) } });
    const res = createResponse();

    csrfProtection(req, res, jest.fn());

    expect(res.statusCode).toBe(403);
    expect(res.render).toHaveBeenCalledWith('error', expect.any(Object));
  });

  test('rechaza POST con token incorrecto o de distinto largo', () => {
    const session = { csrfToken: 'a'.repeat(64) };

    const wrong = createResponse();
    csrfProtection(createRequest({ method: 'POST', body: { _csrf: 'b'.repeat(64) }, session }), wrong, jest.fn());
    expect(wrong.statusCode).toBe(403);

    const short = createResponse();
    csrfProtection(createRequest({ method: 'POST', body: { _csrf: 'a' }, session }), short, jest.fn());
    expect(short.statusCode).toBe(403);
  });

  test('acepta el token en el cuerpo y en la cabecera', () => {
    const session = { csrfToken: 'a'.repeat(64) };

    const bodyNext = jest.fn();
    csrfProtection(createRequest({ method: 'POST', body: { _csrf: 'a'.repeat(64) }, session }), createResponse(), bodyNext);
    expect(bodyNext).toHaveBeenCalled();

    const headerNext = jest.fn();
    csrfProtection(createRequest({ method: 'POST', headers: { 'x-csrf-token': 'a'.repeat(64) }, session }), createResponse(), headerNext);
    expect(headerNext).toHaveBeenCalled();
  });

  test('exige que exista sesión', () => {
    const next = jest.fn();
    const req = createRequest({ session: null });

    csrfProtection(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
