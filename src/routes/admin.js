const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const [users, listings, offers] = await Promise.all([
    pool.query('SELECT count(*)::int AS n FROM users'),
    pool.query(`SELECT count(*)::int AS n, count(*) FILTER (WHERE status='vendido')::int AS vendidos FROM listings`),
    pool.query('SELECT count(*)::int AS n FROM offers')
  ]);
  res.json({
    users: users.rows[0].n,
    listings: listings.rows[0].n,
    listingsVendidos: listings.rows[0].vendidos,
    offers: offers.rows[0].n
  });
});

router.get('/users', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.phone, u.is_admin, u.created_at, u.account_type, u.agency_until,
            (SELECT count(*)::int FROM listings l WHERE l.owner_id = u.id) AS listings_count
     FROM users u ORDER BY u.created_at DESC`
  );
  res.json({
    users: rows.map((r) => ({
      id: r.id, email: r.email, displayName: r.display_name, phone: r.phone,
      isAdmin: r.is_admin, createdAt: r.created_at, listingsCount: r.listings_count,
      isAgency: !!(r.agency_until && new Date(r.agency_until) > new Date()),
      agencyUntil: r.agency_until || null
    }))
  });
});

// PATCH /api/admin/users/:id/agency  { months } to activate the agency plan for N months, or { clear: true } to deactivate.
router.patch('/users/:id/agency', async (req, res) => {
  const b = req.body || {};
  if (b.clear) {
    const { rows } = await pool.query(
      `UPDATE users SET agency_until = NULL, account_type = 'individual' WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese usuario ya no existe.' });
    return res.json({ agencyUntil: null });
  }
  const months = Number(b.months);
  if (!Number.isFinite(months) || months <= 0 || months > 24) {
    return res.status(400).json({ error: 'meses_invalido', message: 'Elegí una cantidad de meses válida (1 a 24).' });
  }
  const { rows } = await pool.query(
    `UPDATE users SET account_type = 'agencia', agency_until = now() + make_interval(months => $1::int) WHERE id = $2 RETURNING agency_until`,
    [Math.round(months), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Ese usuario ya no existe.' });
  res.json({ agencyUntil: rows[0].agency_until });
});

// PATCH /api/admin/listings/:id/feature  { days } to feature for N days, or { clear: true } to unfeature.
router.patch('/listings/:id/feature', async (req, res) => {
  const b = req.body || {};
  if (b.clear) {
    const { rows } = await pool.query(
      'UPDATE listings SET featured_until = NULL WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Esa publicación ya no existe.' });
    return res.json({ featuredUntil: null });
  }
  const days = Number(b.days);
  if (!Number.isFinite(days) || days <= 0 || days > 90) {
    return res.status(400).json({ error: 'dias_invalido', message: 'Elegí una cantidad de días válida (1 a 90).' });
  }
  const { rows } = await pool.query(
    `UPDATE listings SET featured_until = now() + make_interval(days => $1::int) WHERE id = $2 RETURNING featured_until`,
    [Math.round(days), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Esa publicación ya no existe.' });
  res.json({ featuredUntil: rows[0].featured_until });
});

// PATCH /api/admin/listings/:id/verify  { verified: true|false }
router.patch('/listings/:id/verify', async (req, res) => {
  const verified = !!(req.body && req.body.verified);
  const { rows } = await pool.query(
    `UPDATE listings SET verified_at = ${verified ? 'now()' : 'NULL'} WHERE id = $1 RETURNING verified_at`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'no_encontrado', message: 'Esa publicación ya no existe.' });
  res.json({ verifiedAt: rows[0].verified_at });
});

module.exports = router;
