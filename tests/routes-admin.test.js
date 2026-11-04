jest.mock('../db/connection', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const request = require('supertest');
const bcrypt = require('bcrypt');
const pool = require('../db/connection');
const app = require('../src/app');

const admin = {
  id: 1,
  nombre: 'Administrador',
  email: 'admin@example.com',
  rol: 'admin',
  activo: true
};

let agent;
let csrfToken;

beforeAll(async () => {
  agent = request.agent(app);
  const page = await agent.get('/login');
  const token = page.text.match(/name="_csrf" value="([a-f0-9]+)"/)[1];
  const hash = await bcrypt.hash('secreta123', 10);

  pool.query.mockResolvedValueOnce({ rows: [{ ...admin, password_hash: hash }] });

  const login = await agent.post('/login').type('form').send({
    _csrf: token,
    email: 'admin@example.com',
    password: 'secreta123'
  });

  if (login.statusCode !== 302) {
    throw new Error(`No se pudo autenticar como admin: ${login.statusCode}`);
  }

  const home = await agent.get('/');
  csrfToken = home.text.match(/name="_csrf" value="([a-f0-9]+)"/)[1];
});

beforeEach(() => {
  pool.query.mockReset();
});

describe('Rutas de administración', () => {
  test('muestra los indicadores del dashboard', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '12' }] })
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })
      .mockResolvedValueOnce({ rows: [{ count: '8' }] })
      .mockResolvedValueOnce({ rows: [{ count: '2' }] });

    const res = await agent.get('/admin/dashboard');

    expect(res.statusCode).toBe(200);
    expect(pool.query).toHaveBeenCalledTimes(4);
  });

  test('muestra indicadores en cero si falla el dashboard', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.get('/admin/dashboard');

    expect(res.statusCode).toBe(200);
    expect(res.text).not.toMatch(/conexión rechazada/);
  });

  test('lista todas las reservas', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 10,
        fecha: new Date('2030-05-20T00:00:00.000Z'),
        hora: '10:30:00',
        estado: 'pendiente',
        usuario: 'Ana Pérez',
        email: 'ana@example.com',
        servicio: 'Consulta General'
      }]
    });

    const res = await agent.get('/admin/reservas');

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Ana Pérez/);
    expect(res.text).toMatch(/data-autosubmit/);
    expect(res.text).toMatch(/name="_csrf"/);
  });

  test('tolera fallos al listar reservas', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.get('/admin/reservas');

    expect(res.statusCode).toBe(200);
    expect(res.text).not.toMatch(/conexión rechazada/);
  });

  test('lista usuarios', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 7,
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        rol: 'cliente',
        fecha_registro: new Date('2026-01-01T00:00:00.000Z'),
        activo: true
      }]
    });

    const res = await agent.get('/admin/usuarios');

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Ana Pérez/);
  });

  test('tolera fallos al listar usuarios', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.get('/admin/usuarios');

    expect(res.statusCode).toBe(200);
    expect(res.text).not.toMatch(/conexión rechazada/);
  });

  test('actualiza el estado de una reserva', async () => {
    pool.query.mockResolvedValueOnce({});

    const res = await agent.post('/admin/reservas/estado/10').type('form').send({
      _csrf: csrfToken,
      estado: 'confirmada'
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/admin/reservas');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE reservas SET estado/),
      ['confirmada', '10']
    );
  });

  test('rechaza identificadores y estados inválidos', async () => {
    const invalidId = await agent.post('/admin/reservas/estado/abc').type('form').send({
      _csrf: csrfToken,
      estado: 'confirmada'
    });
    expect(invalidId.statusCode).toBe(400);

    const invalidState = await agent.post('/admin/reservas/estado/10').type('form').send({
      _csrf: csrfToken,
      estado: 'inventado'
    });
    expect(invalidState.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('redirige si falla la actualización de estado', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.post('/admin/reservas/estado/10').type('form').send({
      _csrf: csrfToken,
      estado: 'confirmada'
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/admin/reservas');
  });
});
