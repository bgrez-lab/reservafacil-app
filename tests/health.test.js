jest.mock('../db/connection', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const request = require('supertest');
const pool = require('../db/connection');
const app = require('../src/app');

beforeEach(() => {
  pool.query.mockReset();
});

describe('Endpoint de salud', () => {
  test('reporta ok cuando la base de datos responde', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ now: '2026-01-01T00:00:00.000Z' }] });

    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      db: 'connected',
      time: '2026-01-01T00:00:00.000Z'
    });
  });

  test('no filtra detalles internos cuando la base de datos falla', async () => {
    pool.query.mockRejectedValueOnce(new Error('password authentication failed for user "postgres"'));

    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ status: 'error', db: 'disconnected' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/);
  });
});
