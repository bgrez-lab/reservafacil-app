const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../utils/password');

describe('Hash de contraseñas', () => {
  test('genera un hash bcrypt con costo 12 y lo verifica', async () => {
    const hash = await hashPassword('secreta123');

    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash).toHaveLength(60);
    await expect(comparePassword('secreta123', hash)).resolves.toBe(true);
    await expect(comparePassword('otra-clave', hash)).resolves.toBe(false);
  });

  test('usa un salt distinto para la misma contraseña', async () => {
    const [first, second] = await Promise.all([
      hashPassword('secreta123'),
      hashPassword('secreta123')
    ]);

    expect(first).not.toBe(second);
  });

  test('el hash por defecto del administrador es válido', async () => {
    const hash = '$2b$12$gbndSSD.ASDJ7MGz0DdD9O44JR2Y9HUSPXceHtWXUI1aJV36o9HWu';
    await expect(comparePassword('admin123', hash)).resolves.toBe(true);
    expect(bcrypt.getRounds(hash)).toBe(12);
  });
});
