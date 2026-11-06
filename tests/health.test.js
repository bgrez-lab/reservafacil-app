const request = require('supertest');
const app = require('../src/app');

describe('Endpoint de salud', () => {
  test('reporta desconectado cuando MongoDB no está disponible en el entorno de prueba', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ status: 'error', db: 'disconnected' });
  });
});
