const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateName(name) {
  const value = typeof name === 'string' ? name.trim() : '';
  if (value.length < 2 || value.length > 100) {
    return 'El nombre debe tener entre 2 y 100 caracteres';
  }
  return null;
}

function validateEmail(email) {
  const value = normalizeEmail(email);
  if (value.length === 0 || value.length > 100 || !EMAIL_PATTERN.test(value)) {
    return 'El email no tiene un formato válido';
  }
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  // bcrypt solo considera los primeros 72 bytes; evitamos truncamientos silenciosos.
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return 'La contraseña no puede superar los 72 bytes';
  }
  return null;
}

function validateDate(fecha) {
  if (typeof fecha !== 'string' || !DATE_PATTERN.test(fecha)) {
    return 'La fecha debe tener el formato AAAA-MM-DD';
  }

  const parsed = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) {
    return 'La fecha no es válida';
  }

  const today = new Date().toISOString().slice(0, 10);
  if (fecha < today) {
    return 'La fecha no puede ser anterior a hoy';
  }

  return null;
}

function validateTime(hora) {
  if (typeof hora !== 'string' || !TIME_PATTERN.test(hora)) {
    return 'La hora debe tener el formato HH:MM (24 horas)';
  }
  return null;
}

function validateServiceId(servicioId) {
  if (!/^\d+$/.test(String(servicioId)) || Number(servicioId) <= 0) {
    return 'El servicio seleccionado no es válido';
  }
  return null;
}

function validateRegistration({ nombre, email, password, confirmPassword }) {
  const errors = [];

  const nameError = validateName(nombre);
  if (nameError) {errors.push(nameError);}

  const emailError = validateEmail(email);
  if (emailError) {errors.push(emailError);}

  const passwordError = validatePassword(password);
  if (passwordError) {errors.push(passwordError);}

  if (password !== confirmPassword) {
    errors.push('Las contraseñas no coinciden');
  }

  return errors;
}

function validateLogin({ email, password }) {
  const errors = [];

  const emailError = validateEmail(email);
  if (emailError) {errors.push('Email o contraseña inválidos');}

  if (typeof password !== 'string' || password.length === 0) {
    errors.push('Email o contraseña inválidos');
  }

  return errors;
}

function validateReservation({ servicio_id: servicioId, fecha, hora }) {
  const errors = [];

  const serviceError = validateServiceId(servicioId);
  if (serviceError) {errors.push(serviceError);}

  const dateError = validateDate(fecha);
  if (dateError) {errors.push(dateError);}

  const timeError = validateTime(hora);
  if (timeError) {errors.push(timeError);}

  return errors;
}

module.exports = {
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
};
