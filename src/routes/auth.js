const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { setAuthCookie, clearAuthCookie } = require('../auth');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, email: u.email, displayName: u.display_name, phone: u.phone, isAdmin: u.is_admin };
}

router.post('/register', async (req, res) => {
  const { email, password, displayName, phone } = req.body || {};
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'datos_incompletos', message: 'Faltan datos: email, contraseña y nombre son obligatorios.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'password_corta', message: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'email_en_uso', message: 'Ya existe una cuenta con ese email.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, phone, is_admin)
       VALUES ($1,$2,$3,$4,false) RETURNING *`,
      [normalizedEmail, hash, String(displayName).trim(), phone ? String(phone).trim() : null]
    );
    setAuthCookie(res, rows[0]);
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error_servidor', message: 'No se pudo crear la cuenta. Probá de nuevo.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'datos_incompletos', message: 'Ingresá tu email y tu contraseña.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (!rows.length) {
      return res.status(401).json({ error: 'credenciales_invalidas', message: 'Email o contraseña incorrectos.' });
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'credenciales_invalidas', message: 'Email o contraseña incorrectos.' });
    }
    setAuthCookie(res, rows[0]);
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error_servidor', message: 'No se pudo iniciar sesión. Probá de nuevo.' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

module.exports = router;
