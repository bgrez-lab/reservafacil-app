const request = require('supertest');
const app = require('../src/app');

describe('Autenticación', () => {
  test('GET /login debe mostrar formulario de login', async () => {
    const res = await request(app).get('/login');
    expect(res.statusCode).toBe(200);
  });

  test('GET /registro debe mostrar formulario de registro', async () => {
    const res = await request(app).get('/registro');
    expect(res.statusCode).toBe(200);
  });

  test('GET / debe mostrar página principal', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });
});
