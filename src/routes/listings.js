const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
const COUNTRIES = ['PY', 'AR', 'BR', 'UY'];
const MAX_PHOTOS = 4;
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
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    installmentsPaid: row.installments_paid != null ? Number(row.installments_paid) : null,
    installmentsLeft: row.installments_left != null ? Number(row.installments_left) : null,
    installmentAmount: row.installment_amount != null ? Number(row.installment_amount) : null,
    totalPaid: row.total_paid != null ? Number(row.total_paid) : null,
    purchaseStartDate: row.purchase_start_date
      ? (row.purchase_start_date instanceof Date ? row.purchase_start_date.toISOString().slice(0, 10) : row.purchase_start_date)
      : null,
    commissionAcceptedAt: row.commission_accepted_at || null,
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

function positiveIntOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return (Number.isFinite(n) && n >= 0) ? Math.round(n) : null;
}
function positiveNumOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return (Number.isFinite(n) && n >= 0) ? n : null;
}

// Reads + validates the shared listing fields out of a POST/PATCH body.
// Returns { ok:false, error, message } on failure, or { ok:true, ...fields }.
function parseListingBody(b) {
  const title = (b.title || '').trim();
  const zone = (b.zone || '').trim();
  const description = (b.description || '').trim();
  const phone = (b.phone || '').trim();
  const country = COUNTRIES.includes(b.country) ? b.country : 'PY';
  const currency = b.currency === 'PYG' ? 'PYG' : 'USD';
  const price = Number(b.price);
  const photos = Array.isArray(b.photos) ? b.photos.slice(0, MAX_PHOTOS) : [];
  let lat = null, lng = null;
  if (b.lat != null && b.lng != null && b.lat !== '' && b.lng !== '') {
    const latNum = Number(b.lat), lngNum = Number(b.lng);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum) && Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180) {
      lat = latNum; lng = lngNum;
    }
  }
  const installmentsPaid = positiveIntOrNull(b.installmentsPaid);
  const installmentsLeft = positiveIntOrNull(b.installmentsLeft);
  const installmentAmount = positiveNumOrNull(b.installmentAmount);
  const totalPaid = positiveNumOrNull(b.totalPaid);
  let purchaseStartDate = null;
  if (b.purchaseStartDate && /^\d{4}-\d{2}-\d{2}$/.test(b.purchaseStartDate)) {
    const d = new Date(b.purchaseStartDate + 'T00:00:00Z');
    if (!Number.isNaN(d.getTime())) purchaseStartDate = b.purchaseStartDate;
  }

  if (!title || !zone || !description || !phone || !(price > 0)) {
    return { ok: false, error: 'datos_incompletos', message: 'Completá título, zona, precio, teléfono y descripción.' };
  }
  for (const p of photos) {
    if (typeof p !== 'string' || !p.startsWith('data:image/') || p.length > MAX_PHOTO_CHARS) {
      return { ok: false, error: 'foto_invalida', message: 'Una de las fotos es inválida o pesa demasiado.' };
    }
  }
  return {
    ok: true, title, zone, description, phone, country, currency, price, photos, lat, lng,
    installmentsPaid, installmentsLeft, installmentAmount, totalPaid, purchaseStartDate
  };
}

router.post('/', requireAuth, async (req, res) => {
  const parsed = parseListingBody(req.body || {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, message: parsed.message });
  if (req.body.acceptedTerms !== true) {
    return res.status(400).json({ error: 'terminos_no_aceptados', message: 'Tenés que aceptar la condición de la comisión del 5% para publicar.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO listings (owner_id, title, country, zone, price, currency, phone, description, photos, lat, lng, installments_paid, installments_left, installment_amount, total_paid, purchase_start_date, commission_accepted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now()) RETURNING *`,
    [req.user.id, parsed.title, parsed.country, parsed.zone, parsed.price, parsed.currency, parsed.phone, parsed.description, JSON.stringify(parsed.photos), parsed.lat, parsed.lng, parsed.installmentsPaid, parsed.installmentsLeft, parsed.installmentAmount, parsed.totalPaid, parsed.purchaseStartDate]
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
  const b = req.body || {};
  const isFullEdit = Object.prototype.hasOwnProperty.call(b, 'title');

  if (!isFullEdit) {
    // Quick status toggle (marcar vendido/activo) — the only thing the old API accepted.
    const status = b.status;
    if (status && !['activo', 'vendido'].includes(status)) {
      return res.status(400).json({ error: 'estado_invalido', message: 'Estado inválido.' });
    }
    const { rows: updated } = await pool.query(
      'UPDATE listings SET status = COALESCE($1, status) WHERE id = $2 RETURNING *',
      [status || null, req.params.id]
    );
    return res.json({ listing: serialize(updated[0], req.user.id) });
  }

  const parsed = parseListingBody(b);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, message: parsed.message });
  const status = ['activo', 'vendido'].includes(b.status) ? b.status : null;

  await pool.query(
    `UPDATE listings SET title=$1, country=$2, zone=$3, price=$4, currency=$5, phone=$6, description=$7, photos=$8,
       lat=$9, lng=$10, installments_paid=$11, installments_left=$12, installment_amount=$13, total_paid=$14,
       purchase_start_date=$15, status=COALESCE($16, status)
     WHERE id = $17`,
    [parsed.title, parsed.country, parsed.zone, parsed.price, parsed.currency, parsed.phone, parsed.description, JSON.stringify(parsed.photos),
      parsed.lat, parsed.lng, parsed.installmentsPaid, parsed.installmentsLeft, parsed.installmentAmount, parsed.totalPaid,
      parsed.purchaseStartDate, status, req.params.id]
  );
  const { rows: updated } = await pool.query(
    `SELECT l.*, u.display_name AS owner_label FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = $1`,
    [req.params.id]
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
