jest.mock('../db/connection', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const request = require('supertest');
const bcrypt = require('bcrypt');
const pool = require('../db/connection');
const app = require('../src/app');

const servicios = [
  { id: 1, nombre: 'Consulta General', duracion_minutos: 30 },
  { id: 2, nombre: 'Odontología', duracion_minutos: 45 }
];

const cliente = {
  id: 7,
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  rol: 'cliente',
  activo: true
};

let agent;

beforeAll(async () => {
  agent = request.agent(app);
  const page = await agent.get('/login');
  const token = page.text.match(/name="_csrf" value="([a-f0-9]+)"/)[1];
  const hash = await bcrypt.hash('secreta123', 10);

  pool.query.mockResolvedValueOnce({ rows: [{ ...cliente, password_hash: hash }] });

  const login = await agent.post('/login').type('form').send({
    _csrf: token,
    email: 'ana@example.com',
    password: 'secreta123'
  });

  if (login.statusCode !== 302) {
    throw new Error(`No se pudo autenticar para las pruebas: ${login.statusCode}`);
  }
});

beforeEach(() => {
  pool.query.mockReset();
  pool.connect.mockReset();
});

async function getCsrf() {
  pool.query.mockResolvedValueOnce({ rows: servicios });
  const page = await agent.get('/reservas/nueva');
  return page.text.match(/name="_csrf" value="([a-f0-9]+)"/)[1];
}

function createClient() {
  return {
    query: jest.fn(),
    release: jest.fn()
  };
}

const reservaRow = {
  id: 10,
  fecha: new Date('2030-05-20T00:00:00.000Z'),
  hora: '10:30:00',
  estado: 'pendiente',
  servicio: 'Consulta General',
  duracion_minutos: 30
};

describe('Rutas de reservas', () => {
  test('muestra el formulario con los servicios activos', async () => {
    pool.query.mockResolvedValueOnce({ rows: servicios });

    const res = await agent.get('/reservas/nueva');

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Consulta General/);
    expect(res.text).toMatch(/Odontología/);
    expect(res.text).toMatch(/name="_csrf"/);
  });

  test('muestra un error controlado si fallan los servicios', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.get('/reservas/nueva');

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/No se pudieron cargar los servicios/);
    expect(res.text).not.toMatch(/conexión rechazada/);
  });

  test('rechaza reservas con datos inválidos', async () => {
    const token = await getCsrf();
    pool.query.mockResolvedValueOnce({ rows: servicios });

    const res = await agent.post('/reservas/nueva').type('form').send({
      _csrf: token,
      servicio_id: '1',
      fecha: '2000-01-01',
      hora: '25:00'
    });

    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/anterior a hoy/);
  });

  test('rechaza un servicio inexistente o inactivo', async () => {
    const token = await getCsrf();
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: servicios });

    const res = await agent.post('/reservas/nueva').type('form').send({
      _csrf: token,
      servicio_id: '1',
      fecha: '2030-05-20',
      hora: '10:30'
    });

    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/servicio seleccionado no está disponible/);
  });

  test('rechaza un horario ya ocupado dentro de una transacción', async () => {
    const token = await getCsrf();
    const client = createClient();
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })
      .mockResolvedValueOnce({});

    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: servicios });
    pool.connect.mockResolvedValueOnce(client);

    const res = await agent.post('/reservas/nueva').type('form').send({
      _csrf: token,
      servicio_id: '1',
      fecha: '2030-05-20',
      hora: '10:30'
    });

    expect(res.statusCode).toBe(409);
    expect(res.text).toMatch(/Horario no disponible/);
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(client.release).toHaveBeenCalled();
    expect(pool.query.mock.calls.some(([sql]) => /INSERT INTO reservas/.test(sql))).toBe(false);
  });

  test('crea la reserva y redirige a mis reservas', async () => {
    const token = await getCsrf();
    const client = createClient();
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    pool.connect.mockResolvedValueOnce(client);

    const res = await agent.post('/reservas/nueva').type('form').send({
      _csrf: token,
      servicio_id: '1',
      fecha: '2030-05-20',
      hora: '10:30'
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/reservas/mis-reservas');
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  test('traduce la violación de unicidad en un conflicto de horario', async () => {
    const token = await getCsrf();
    const client = createClient();
    client.query.mockImplementation((sql) => {
      if (sql === 'BEGIN') {return Promise.resolve({});}
      if (/^SELECT id FROM reservas/.test(sql)) {return Promise.resolve({ rows: [] });}
      if (/^INSERT INTO reservas/.test(sql)) {
        return Promise.reject(Object.assign(new Error('duplicado'), { code: '23505' }));
      }
      if (sql === 'ROLLBACK') {return Promise.resolve({});}
      return Promise.resolve({});
    });

    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: servicios });
    pool.connect.mockResolvedValueOnce(client);

    const res = await agent.post('/reservas/nueva').type('form').send({
      _csrf: token,
      servicio_id: '1',
      fecha: '2030-05-20',
      hora: '10:30'
    });

    expect(res.statusCode).toBe(409);
    expect(res.text).toMatch(/Horario no disponible/);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  test('lista las reservas del usuario autenticado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [reservaRow] });

    const res = await agent.get('/reservas/mis-reservas');

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Consulta General/);
    expect(res.text).toMatch(/2030-05-20/);
    expect(res.text).toMatch(/name="_csrf"/);
  });

  test('muestra un error controlado si no se pueden listar las reservas', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.get('/reservas/mis-reservas');

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/No se pudieron cargar las reservas/);
    expect(res.text).not.toMatch(/conexión rechazada/);
  });

  test('rechaza un identificador de reserva no numérico', async () => {
    const token = await getCsrf();

    const res = await agent.post('/reservas/cancelar/abc').type('form').send({ _csrf: token });

    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/Reserva no válida/);
  });

  test('impide cancelar reservas de otros usuarios', async () => {
    const token = await getCsrf();
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await agent.post('/reservas/cancelar/10').type('form').send({ _csrf: token });

    expect(res.statusCode).toBe(403);
    expect(res.text).toMatch(/No tienes permiso/);
  });

  test('no vuelve a cancelar una reserva ya cancelada', async () => {
    const token = await getCsrf();
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10, estado: 'cancelada' }] });

    const res = await agent.post('/reservas/cancelar/10').type('form').send({ _csrf: token });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/reservas/mis-reservas');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test('cancela una reserva propia', async () => {
    const token = await getCsrf();
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 10, estado: 'pendiente' }] })
      .mockResolvedValueOnce({});

    const res = await agent.post('/reservas/cancelar/10').type('form').send({ _csrf: token });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/reservas/mis-reservas');
    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/UPDATE reservas SET estado/),
      ['cancelada', '10']
    );
  });

  test('redirige de forma segura si falla la cancelación', async () => {
    const token = await getCsrf();
    pool.query.mockRejectedValueOnce(new Error('conexión rechazada'));

    const res = await agent.post('/reservas/cancelar/10').type('form').send({ _csrf: token });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/reservas/mis-reservas');
  });
});
