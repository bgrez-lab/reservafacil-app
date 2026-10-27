const request = require('supertest');
const app = require('../src/app');

describe('Aplicación ReservaFácil SpA', () => {
  test('Página principal responde correctamente', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });

  test('Ruta protegida redirige sin autenticación', async () => {
    const response = await request(app).get('/reservas/mis-reservas');
    expect(response.statusCode).toBe(302);
  });

  test('Ruta admin redirige sin autenticación', async () => {
    const response = await request(app).get('/admin/dashboard');
    expect(response.statusCode).toBe(302);
  });
});
