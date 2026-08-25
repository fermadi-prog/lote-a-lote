const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
const COUNTRIES = ['PY', 'AR', 'BR', 'UY'];
const CATEGORIES = ['dron', 'fotografia', 'video', 'fumigacion', 'otros'];
const MAX_PHOTOS = 4;
const MAX_PHOTO_CHARS = 400000;

function serialize(row, viewerId) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerLabel: row.owner_label || row.display_name,
    category: row.category,
    title: row.title,
    country: row.country,
    zone: row.zone,
    price: row.price != null ? Number(row.price) : null,
    currency: row.currency,
    phone: row.phone,
    description: row.description,
    photos: row.photos || [],
    createdAt: row.created_at,
    isMine: viewerId ? row.owner_id === viewerId : false
  };
}

// GET /api/services?category=&country=&zone=&q=
router.get('/', async (req, res) => {
  const { category, country, zone, q } = req.query;
  const clauses = [];
  const params = [];
  if (category && CATEGORIES.includes(category)) { params.push(category); clauses.push(`s.category = $${params.length}`); }
  if (country) { params.push(country); clauses.push(`s.country = $${params.length}`); }
  if (zone) { params.push(zone); clauses.push(`s.zone = $${params.length}`); }
  if (q) {
    params.push('%' + q + '%');
    clauses.push(`(s.title ILIKE $${params.length} OR s.zone ILIKE $${params.length} OR s.description ILIKE $${params.length})`);
  }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT s.*, u.display_name AS owner_label
     FROM services s JOIN users u ON u.id = s.owner_id
     ${where} ORDER BY s.created_at DESC LIMIT 300`,
    params
  );
  res.json({ services: rows.map((r) => serialize(r, req.user && req.user.id)) });
});

router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.display_name AS owner_label
     FROM services s JOIN users u ON u.id = s.owner_id
     WHERE s.owner_id = $1 ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  res.json({ services: rows.map((r) => serialize(r, req.user.id)) });
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.display_name AS owner_label FROM services s JOIN users u ON u.id = s.owner_id WHERE s.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese servicio ya no existe.' });
  res.json({ service: serialize(rows[0], req.user && req.user.id) });
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const category = CATEGORIES.includes(b.category) ? b.category : 'otros';
  const title = (b.title || '').trim();
  const zone = (b.zone || '').trim();
  const description = (b.description || '').trim();
  const phone = (b.phone || '').trim();
  const country = COUNTRIES.includes(b.country) ? b.country : 'PY';
  const currency = b.currency === 'PYG' ? 'PYG' : 'USD';
  let price = null;
  if (b.price != null && b.price !== '') {
    const n = Number(b.price);
    if (Number.isFinite(n) && n >= 0) price = n;
  }
  const photos = Array.isArray(b.photos) ? b.photos.slice(0, MAX_PHOTOS) : [];

  if (!title || !zone || !description || !phone) {
    return res.status(400).json({ error: 'datos_incompletos', message: 'Completá título, zona, teléfono y descripción.' });
  }
  for (const p of photos) {
    if (typeof p !== 'string' || !p.startsWith('data:image/') || p.length > MAX_PHOTO_CHARS) {
      return res.status(400).json({ error: 'foto_invalida', message: 'Una de las fotos es inválida o pesa demasiado.' });
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO services (owner_id, category, title, country, zone, price, currency, phone, description, photos)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.id, category, title, country, zone, price, currency, phone, description, JSON.stringify(photos)]
  );
  res.status(201).json({ service: serialize({ ...rows[0], owner_label: req.user.display_name }, req.user.id) });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese servicio ya no existe.' });
  if (rows[0].owner_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: 'no_autorizado', message: 'Solo el dueño del servicio (o un administrador) puede eliminarlo.' });
  }
  await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
