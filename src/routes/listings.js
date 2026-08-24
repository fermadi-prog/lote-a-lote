const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
const COUNTRIES = ['PY', 'AR', 'BR', 'UY'];
const MAX_PHOTOS = 2;
const MAX_PHOTO_CHARS = 400000; // ~400KB of base64 per photo, generous ceiling for a compressed jpeg

function serialize(row, viewerId) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerLabel: row.owner_label || row.display_name,
    title: row.title,
    country: row.country,
    zone: row.zone,
    price: Number(row.price),
    currency: row.currency,
    phone: row.phone,
    description: row.description,
    photos: row.photos || [],
    status: row.status,
    createdAt: row.created_at,
    isMine: viewerId ? row.owner_id === viewerId : false
  };
}

// GET /api/listings?country=&zone=&q=&sort=
router.get('/', async (req, res) => {
  const { country, zone, q, sort } = req.query;
  const clauses = [];
  const params = [];
  if (country) { params.push(country); clauses.push(`l.country = $${params.length}`); }
  if (zone) { params.push(zone); clauses.push(`l.zone = $${params.length}`); }
  if (q) {
    params.push('%' + q + '%');
    clauses.push(`(l.title ILIKE $${params.length} OR l.zone ILIKE $${params.length} OR l.description ILIKE $${params.length})`);
  }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const order = sort === 'menor' ? 'l.price ASC' : sort === 'mayor' ? 'l.price DESC' : 'l.created_at DESC';
  const { rows } = await pool.query(
    `SELECT l.*, u.display_name AS owner_label
     FROM listings l JOIN users u ON u.id = l.owner_id
     ${where} ORDER BY ${order} LIMIT 300`,
    params
  );
  res.json({ listings: rows.map((r) => serialize(r, req.user && req.user.id)) });
});

router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, u.display_name AS owner_label
     FROM listings l JOIN users u ON u.id = l.owner_id
     WHERE l.owner_id = $1 ORDER BY l.created_at DESC`,
    [req.user.id]
  );
  res.json({ listings: rows.map((r) => serialize(r, req.user.id)) });
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, u.display_name AS owner_label
     FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese lote ya no existe.' });
  res.json({ listing: serialize(rows[0], req.user && req.user.id) });
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const title = (b.title || '').trim();
  const zone = (b.zone || '').trim();
  const description = (b.description || '').trim();
  const phone = (b.phone || '').trim();
  const country = COUNTRIES.includes(b.country) ? b.country : 'PY';
  const currency = b.currency === 'PYG' ? 'PYG' : 'USD';
  const price = Number(b.price);
  const photos = Array.isArray(b.photos) ? b.photos.slice(0, MAX_PHOTOS) : [];

  if (!title || !zone || !description || !phone || !(price > 0)) {
    return res.status(400).json({ error: 'datos_incompletos', message: 'Completá título, zona, precio, teléfono y descripción.' });
  }
  for (const p of photos) {
    if (typeof p !== 'string' || !p.startsWith('data:image/') || p.length > MAX_PHOTO_CHARS) {
      return res.status(400).json({ error: 'foto_invalida', message: 'Una de las fotos es inválida o pesa demasiado.' });
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO listings (owner_id, title, country, zone, price, currency, phone, description, photos)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.id, title, country, zone, price, currency, phone, description, JSON.stringify(photos)]
  );
  res.status(201).json({ listing: serialize({ ...rows[0], owner_label: req.user.display_name }, req.user.id) });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese lote ya no existe.' });
  const listing = rows[0];
  if (listing.owner_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: 'no_autorizado', message: 'Solo el dueño del lote (o un administrador) puede editarlo.' });
  }
  const status = req.body && req.body.status;
  if (status && !['activo', 'vendido'].includes(status)) {
    return res.status(400).json({ error: 'estado_invalido', message: 'Estado inválido.' });
  }
  const { rows: updated } = await pool.query(
    'UPDATE listings SET status = COALESCE($1, status) WHERE id = $2 RETURNING *',
    [status || null, req.params.id]
  );
  res.json({ listing: serialize(updated[0], req.user.id) });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese lote ya no existe.' });
  if (rows[0].owner_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: 'no_autorizado', message: 'Solo el dueño del lote (o un administrador) puede eliminarlo.' });
  }
  await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
