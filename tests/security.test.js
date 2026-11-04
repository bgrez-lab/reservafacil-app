const request = require('supertest');
const app = require('../src/app');

function extractCsrf(response) {
  const match = response.text.match(/name="_csrf" value="([a-f0-9]+)"/);
  return match ? match[1] : null;
}

describe('Controles de seguridad HTTP', () => {
  test('envía cabeceras de seguridad y CSP estricta', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain('https://cdn.jsdelivr.net');
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('no habilita CORS si no se configura un origen', async () => {
    const res = await request(app).get('/');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('los formularios incluyen token CSRF', async () => {
    const login = await request(app).get('/login');
    expect(extractCsrf(login)).toMatch(/^[a-f0-9]{64}$/);

    const registro = await request(app).get('/registro');
    expect(extractCsrf(registro)).toMatch(/^[a-f0-9]{64}$/);
  });

  test('rechaza POST sin token CSRF', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'ana@example.com', password: 'secreta123' });

    expect(res.statusCode).toBe(403);
    expect(res.text).toMatch(/Solicitud no válida/);
  });

  test('rechaza POST con token de otra sesión', async () => {
    const first = request.agent(app);
    const page = await first.get('/login');
    const token = extractCsrf(page);

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ _csrf: token, email: 'ana@example.com', password: 'secreta123' });

    expect(res.statusCode).toBe(403);
  });

  test('acepta POST con el token de su propia sesión', async () => {
    const agent = request.agent(app);
    const page = await agent.get('/login');
    const token = extractCsrf(page);

    const res = await agent
      .post('/login')
      .type('form')
      .send({ _csrf: token, email: 'no-es-email', password: '' });

    expect(res.statusCode).toBe(400);
  });

  test('responde 404 con plantilla de error', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.statusCode).toBe(404);
    expect(res.text).toMatch(/Página no encontrada/);
  });
});
