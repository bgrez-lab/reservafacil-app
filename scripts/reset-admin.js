const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const pool = require('../db/connection');
const { hashPassword } = require('../utils/password');

async function resetAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@reservafacil.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const nombre = process.env.ADMIN_NAME || 'Administrador';

  try {
    console.log('Generando hash para contraseña...');
    const passwordHash = await hashPassword(password);

    console.log('Actualizando/creando usuario administrador...');
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
       VALUES ($1, $2, $3, 'admin', true)
       ON CONFLICT (email)
       DO UPDATE SET
         nombre = EXCLUDED.nombre,
         password_hash = EXCLUDED.password_hash,
         rol = 'admin',
         activo = true
       RETURNING id, nombre, email, rol`,
      [nombre, email, passwordHash]
    );

    console.log('Administrador listo:');
    console.log(result.rows[0]);

    if (!process.env.ADMIN_PASSWORD) {
      console.warn('\nATENCIÓN: se usó la contraseña por defecto "admin123".');
      console.warn('Define ADMIN_PASSWORD y vuelve a ejecutar este script antes de producción.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAdmin();
