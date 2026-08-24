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
    `SELECT u.id, u.email, u.display_name, u.phone, u.is_admin, u.created_at,
            (SELECT count(*)::int FROM listings l WHERE l.owner_id = u.id) AS listings_count
     FROM users u ORDER BY u.created_at DESC`
  );
  res.json({
    users: rows.map((r) => ({
      id: r.id, email: r.email, displayName: r.display_name, phone: r.phone,
      isAdmin: r.is_admin, createdAt: r.created_at, listingsCount: r.listings_count
    }))
  });
});

module.exports = router;
