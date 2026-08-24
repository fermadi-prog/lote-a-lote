const jwt = require('jsonwebtoken');
const pool = require('./db');

const COOKIE_NAME = 'lal_session';
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(user) {
  return jwt.sign({ uid: user.id }, SECRET, { expiresIn: '30d' });
}

function setAuthCookie(res, user) {
  res.cookie(COOKIE_NAME, signToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

// Attaches req.user (or null) based on the session cookie. Never rejects —
// routes that require auth use requireAuth below.
async function attachUser(req, res, next) {
  req.user = null;
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token) return next();
    const payload = jwt.verify(token, SECRET);
    const { rows } = await pool.query(
      'SELECT id, email, display_name, phone, is_admin FROM users WHERE id = $1',
      [payload.uid]
    );
    if (rows.length) req.user = rows[0];
  } catch (e) {
    // Invalid/expired token: treat as logged out.
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'no_autenticado', message: 'Necesitás iniciar sesión.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'solo_admin', message: 'Esta acción es solo para administradores.' });
  }
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin, setAuthCookie, clearAuthCookie };
