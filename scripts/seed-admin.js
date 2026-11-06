require('dotenv').config();
const { connectDatabase } = require('../db/connection');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

async function seedAdmin() {
  await connectDatabase();

  const email = (process.env.ADMIN_EMAIL || 'admin@reservafacil.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const nombre = process.env.ADMIN_NAME || 'Administrador';

  const passwordHash = await hashPassword(password);

  await User.findOneAndUpdate(
    { email },
    { nombre, email, passwordHash, rol: 'admin', activo: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('Administrador listo:', email);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ATENCION: se uso la contraseña por defecto "admin123". Define ADMIN_PASSWORD antes de producción.');
  }

  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
