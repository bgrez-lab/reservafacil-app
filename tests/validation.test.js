const {
  normalizeEmail,
  validateName,
  validateEmail,
  validatePassword,
  validateDate,
  validateTime,
  validateServiceId,
  validateRegistration,
  validateLogin,
  validateReservation
} = require('../utils/validation');

function futureDate(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('Utilidades de validación', () => {
  test('normaliza el email', () => {
    expect(normalizeEmail('  Usuario@Example.COM ')).toBe('usuario@example.com');
    expect(normalizeEmail(null)).toBe('');
  });

  test('valida nombres', () => {
    expect(validateName('Ana')).toBeNull();
    expect(validateName('A')).toMatch(/2 y 100/);
    expect(validateName('x'.repeat(101))).toMatch(/2 y 100/);
    expect(validateName(undefined)).toMatch(/2 y 100/);
  });

  test('valida emails', () => {
    expect(validateEmail('persona@dominio.cl')).toBeNull();
    expect(validateEmail('sin-arroba')).toMatch(/formato/);
    expect(validateEmail('')).toMatch(/formato/);
    expect(validateEmail(`${'a'.repeat(96)}@x.cl`)).toMatch(/formato/);
  });

  test('valida contraseñas', () => {
    expect(validatePassword('secreta')).toBeNull();
    expect(validatePassword('corta')).toMatch(/6 caracteres/);
    expect(validatePassword('ñ'.repeat(40))).toMatch(/72 bytes/);
    expect(validatePassword(1234)).toMatch(/6 caracteres/);
  });

  test('valida fechas', () => {
    expect(validateDate(futureDate(1))).toBeNull();
    expect(validateDate('2024-02-30')).toMatch(/no es válida/);
    expect(validateDate('01-01-2025')).toMatch(/AAAA-MM-DD/);
    expect(validateDate('2000-01-01')).toMatch(/anterior a hoy/);
    expect(validateDate(undefined)).toMatch(/AAAA-MM-DD/);
  });

  test('valida horas', () => {
    expect(validateTime('09:30')).toBeNull();
    expect(validateTime('23:59')).toBeNull();
    expect(validateTime('24:00')).toMatch(/HH:MM/);
    expect(validateTime('9:30')).toMatch(/HH:MM/);
    expect(validateTime(null)).toMatch(/HH:MM/);
  });

  test('valida identificadores de servicio', () => {
    expect(validateServiceId('3')).toBeNull();
    expect(validateServiceId(3)).toBeNull();
    expect(validateServiceId('0')).toMatch(/no es válido/);
    expect(validateServiceId('1 OR 1=1')).toMatch(/no es válido/);
  });

  test('valida registro completo', () => {
    expect(validateRegistration({
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'secreta1',
      confirmPassword: 'secreta1'
    })).toEqual([]);

    const errors = validateRegistration({
      nombre: 'A',
      email: 'invalido',
      password: '123',
      confirmPassword: '456'
    });
    expect(errors).toHaveLength(4);
  });

  test('valida login sin revelar qué campo falló', () => {
    expect(validateLogin({ email: 'ana@example.com', password: 'secreta' })).toEqual([]);
    expect(validateLogin({ email: '', password: '' })).toEqual([
      'Email o contraseña inválidos',
      'Email o contraseña inválidos'
    ]);
  });

  test('valida reservas', () => {
    expect(validateReservation({
      servicio_id: '1',
      fecha: futureDate(2),
      hora: '10:00'
    })).toEqual([]);

    expect(validateReservation({
      servicio_id: 'abc',
      fecha: 'ayer',
      hora: '25:00'
    })).toHaveLength(3);
  });
});
