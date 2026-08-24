// Aplica el esquema y crea (o actualiza) el usuario administrador a partir
// de las variables de entorno ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
// Se corre automáticamente al arrancar el servidor (ver src/server.js).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function migrate(pool) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  if (adminEmail && adminPassword) {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail.toLowerCase()]);
    const hash = await bcrypt.hash(adminPassword, 10);
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO users (email, password_hash, display_name, is_admin) VALUES ($1,$2,$3,true)',
        [adminEmail.toLowerCase(), hash, adminName]
      );
      console.log('[migrate] usuario administrador creado:', adminEmail);
    } else {
      // Ya existe: nos aseguramos de que siga marcado como admin (no pisamos su contraseña
      // si ya la cambió — solo la seteamos la primera vez que se crea la fila, arriba).
      await pool.query('UPDATE users SET is_admin = true WHERE id = $1', [rows[0].id]);
    }
  } else {
    console.warn('[migrate] ADMIN_EMAIL / ADMIN_PASSWORD no están definidos: no se crea usuario administrador.');
  }
}

if (require.main === module) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  migrate(pool)
    .then(() => { console.log('[migrate] listo'); return pool.end(); })
    .catch((err) => { console.error('[migrate] error', err); process.exit(1); });
}

module.exports = { migrate };
