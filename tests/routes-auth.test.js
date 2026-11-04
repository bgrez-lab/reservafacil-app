jest.mock('../db/connection', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const request = require('supertest');
const bcrypt = require('bcrypt');
const pool = require('../db/connection');
const app = require('../src/app');

let passwordHash;

beforeAll(async () => {
  passwordHash = await bcrypt.hash('secreta123', 10);
});

beforeEach(() => {
  pool.query.mockReset();
});

function extractCsrf(response) {
  const match = response.text.match(/name="_csrf" value="([a-f0-9]+)"/);
  return match ? match[1] : null;
}

async function csrfFrom(agent, path) {
  const response = await agent.get(path);
  return extractCsrf(response);
}

const validUser = {
  id: 7,
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  rol: 'cliente',
  activo: true
};

describe('Rutas de autenticación', () => {
  test('rechaza registro con datos inválidos', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/registro');

    const res = await agent.post('/registro').type('form').send({
      _csrf: token,
      nombre: 'A',
      email: 'invalido',
      password: '123',
      confirmPassword: '456'
    });

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
    expect(res.text).toMatch(/El nombre debe tener entre 2 y 100 caracteres/);
  });

  test('rechaza registro con email existente sin revelar detalles internos', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/registro');
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await agent.post('/registro').type('form').send({
      _csrf: token,
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'secreta123',
      confirmPassword: 'secreta123'
    });

    expect(res.statusCode).toBe(409);
    expect(res.text).toMatch(/ya está registrado/);
  });

  test('registra un usuario y crea la sesión', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/registro');

    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [validUser] });

    const res = await agent.post('/registro').type('form').send({
      _csrf: token,
      nombre: '  Ana Pérez ',
      email: '  ANA@Example.com ',
      password: 'secreta123',
      confirmPassword: 'secreta123'
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');

    const insertParams = pool.query.mock.calls[1][1];
    expect(insertParams[0]).toBe('Ana Pérez');
    expect(insertParams[1]).toBe('ana@example.com');
    expect(insertParams[2]).toMatch(/^\$2[aby]\$12\$/);
    expect(insertParams[3]).toBe('cliente');
  });

  test('devuelve 500 sin detalles cuando el registro falla en la base de datos', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/registro');
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.post('/registro').type('form').send({
      _csrf: token,
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'secreta123',
      confirmPassword: 'secreta123'
    });

    expect(res.statusCode).toBe(500);
    expect(res.text).toMatch(/No se pudo completar el registro/);
    expect(res.text).not.toMatch(/conexión rechazada/);
  });

  test('rechaza login con usuario inexistente', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/login');
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await agent.post('/login').type('form').send({
      _csrf: token,
      email: 'nadie@example.com',
      password: 'secreta123'
    });

    expect(res.statusCode).toBe(401);
    expect(res.text).toMatch(/Credenciales inválidas/);
  });

  test('rechaza login de cuenta desactivada sin revelar el motivo', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/login');
    pool.query.mockResolvedValueOnce({ rows: [{ ...validUser, activo: false, password_hash: passwordHash }] });

    const res = await agent.post('/login').type('form').send({
      _csrf: token,
      email: 'ana@example.com',
      password: 'secreta123'
    });

    expect(res.statusCode).toBe(401);
    expect(res.text).toMatch(/Credenciales inválidas/);
  });

  test('rechaza login con contraseña incorrecta', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/login');
    pool.query.mockResolvedValueOnce({ rows: [{ ...validUser, password_hash: passwordHash }] });

    const res = await agent.post('/login').type('form').send({
      _csrf: token,
      email: 'ana@example.com',
      password: 'incorrecta'
    });

    expect(res.statusCode).toBe(401);
    expect(res.text).toMatch(/Credenciales inválidas/);
  });

  test('inicia sesión con credenciales válidas y permite cerrar sesión', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/login');
    pool.query.mockResolvedValueOnce({ rows: [{ ...validUser, password_hash: passwordHash }] });

    const login = await agent.post('/login').type('form').send({
      _csrf: token,
      email: 'ANA@example.com',
      password: 'secreta123'
    });

    expect(login.statusCode).toBe(302);
    expect(login.headers.location).toBe('/');

    const home = await agent.get('/');
    expect(home.text).toMatch(/Hola, Ana Pérez/);

    const logoutToken = home.text.match(/name="_csrf" value="([a-f0-9]+)"/)[1];
    const logout = await agent.post('/logout').type('form').send({ _csrf: logoutToken });
    expect(logout.statusCode).toBe(302);
    expect(logout.headers.location).toBe('/');

    const protectedPage = await agent.get('/reservas/mis-reservas');
    expect(protectedPage.statusCode).toBe(302);
    expect(protectedPage.headers.location).toBe('/login');
  });

  test('redirige a usuarios ya autenticados fuera de login y registro', async () => {
    const agent = request.agent(app);
    const token = await csrfFrom(agent, '/login');
    pool.query.mockResolvedValueOnce({ rows: [{ ...validUser, password_hash: passwordHash }] });

    await agent.post('/login').type('form').send({
      _csrf: token,
      email: 'ana@example.com',
      password: 'secreta123'
    });

    const login = await agent.get('/login');
    expect(login.statusCode).toBe(302);
    expect(login.headers.location).toBe('/');

    const registro = await agent.get('/registro');
    expect(registro.statusCode).toBe(302);
    expect(registro.headers.location).toBe('/');
  });
});
