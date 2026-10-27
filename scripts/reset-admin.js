const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const pool = require('../db/connection');
const { hashPassword } = require('../utils/password');

async function resetAdmin() {
  try {
    const email = 'admin@reservafacil.com';
    const password = 'admin123';
    const nombre = 'Administrador';
    
    console.log('Generando hash para contraseña...');
    const passwordHash = await hashPassword(password);
    
    console.log('Actualizando/creando usuario administrador...');
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, activo) 
       VALUES ($1, $2, $3, 'admin', true)
       ON CONFLICT (email) 
       DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         rol = 'admin',
         activo = true
       RETURNING id, nombre, email, rol`,
      [nombre, email, passwordHash]
    );
    
    console.log('✅ Administrador listo:');
    console.log(result.rows[0]);
    console.log('\nCredenciales:');
    console.log('Email:', email);
    console.log('Contraseña:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAdmin();
