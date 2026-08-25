const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();
const COUNTRIES = ['PY', 'AR', 'BR', 'UY'];

function serialize(row) {
  return {
    id: row.id,
    zone: row.zone,
    country: row.country,
    pricePerM2: Number(row.price_per_m2),
    currency: row.currency,
    note: row.note || null,
    createdAt: row.created_at
  };
}

// GET /api/zone-prices?country=&zone=  — público, cualquiera puede consultar los valores de referencia.
router.get('/', async (req, res) => {
  const { country, zone } = req.query;
  const clauses = [];
  const params = [];
  if (country) { params.push(country); clauses.push(`country = $${params.length}`); }
  if (zone) { params.push(zone); clauses.push(`zone = $${params.length}`); }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT * FROM zone_prices ${where} ORDER BY created_at DESC LIMIT 200`,
    params
  );
  res.json({ zonePrices: rows.map(serialize) });
});

// POST /api/zone-prices  — solo admin, carga un valor de referencia curado por el equipo.
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const b = req.body || {};
  const zone = (b.zone || '').trim();
  const country = COUNTRIES.includes(b.country) ? b.country : 'PY';
  const currency = b.currency === 'PYG' ? 'PYG' : 'USD';
  const note = (b.note || '').trim() || null;
  const pricePerM2 = Number(b.pricePerM2);

  if (!zone || !(pricePerM2 > 0)) {
    return res.status(400).json({ error: 'datos_incompletos', message: 'Completá la zona y un precio por m² válido.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO zone_prices (zone, country, price_per_m2, currency, note) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [zone, country, pricePerM2, currency, note]
  );
  res.status(201).json({ zonePrice: serialize(rows[0]) });
});

// DELETE /api/zone-prices/:id  — solo admin.
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT id FROM zone_prices WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese valor de referencia ya no existe.' });
  await pool.query('DELETE FROM zone_prices WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
