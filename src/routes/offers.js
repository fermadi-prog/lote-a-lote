const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
const ACTIVE_STATUSES = ['pendiente', 'contraoferta', 'aceptada'];

function serialize(row, listing, meId) {
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    buyerLabel: row.buyer_label,
    status: row.status,
    bids: row.bids || [],
    listing: listing ? {
      id: listing.id, title: listing.title, zone: listing.zone, country: listing.country,
      price: Number(listing.price), currency: listing.currency, status: listing.status,
      ownerId: listing.owner_id, ownerLabel: listing.owner_label
    } : undefined,
    dir: listing ? (row.buyer_id === meId ? 'enviaste' : 'recibiste') : undefined
  };
}

async function loadListing(id) {
  const { rows } = await pool.query(
    `SELECT l.*, u.display_name AS owner_label FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = $1`,
    [id]
  );
  return rows[0] || null;
}
async function loadOffer(id) {
  const { rows } = await pool.query('SELECT * FROM offers WHERE id = $1', [id]);
  return rows[0] || null;
}

// POST /api/offers  { listingId, amount, message }
router.post('/', requireAuth, async (req, res) => {
  const listingId = req.body && req.body.listingId;
  if (!listingId) return res.status(400).json({ error: 'datos_incompletos', message: 'Falta indicar el lote.' });
  const listing = await loadListing(listingId);
  if (!listing) return res.status(404).json({ error: 'no_encontrado', message: 'Ese lote ya no existe.' });
  if (listing.owner_id === req.user.id) {
    return res.status(400).json({ error: 'propio_lote', message: 'No podés ofertar por tu propio lote.' });
  }
  if (listing.status === 'vendido') {
    return res.status(400).json({ error: 'ya_vendido', message: 'Ese lote ya fue marcado como vendido.' });
  }
  const type = (req.body && req.body.type === 'trueque') ? 'trueque' : 'efectivo';
  const message = ((req.body && req.body.message) || '').trim().slice(0, 500);
  let amount = null;
  let description = null;
  if (type === 'trueque') {
    description = ((req.body && req.body.description) || '').trim().slice(0, 300);
    if (!description) {
      return res.status(400).json({ error: 'descripcion_invalida', message: 'Contá qué ofrecés a cambio (ej: un vehículo, otro terreno).' });
    }
  } else {
    amount = Number(req.body && req.body.amount);
    if (!(amount > 0)) {
      return res.status(400).json({ error: 'monto_invalido', message: 'Ingresá un monto de oferta válido.' });
    }
  }

  const existing = await pool.query(
    `SELECT id FROM offers WHERE listing_id = $1 AND buyer_id = $2 AND status = ANY($3)`,
    [listing.id, req.user.id, ACTIVE_STATUSES]
  );
  if (existing.rows.length) {
    return res.status(409).json({ error: 'oferta_activa', message: 'Ya tenés una oferta activa por este lote.' });
  }

  const bids = [{ by: 'comprador', type, amount, description, message, ts: Date.now() }];
  const { rows } = await pool.query(
    `INSERT INTO offers (listing_id, buyer_id, status, bids) VALUES ($1,$2,'pendiente',$3) RETURNING *`,
    [listing.id, req.user.id, JSON.stringify(bids)]
  );
  res.status(201).json({ offer: serialize({ ...rows[0], buyer_label: req.user.display_name }, listing, req.user.id) });
});

// GET /api/offers/mine — sent (as buyer) + received (on my listings)
router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, b.display_name AS buyer_label,
            l.id AS l_id, l.title AS l_title, l.zone AS l_zone, l.country AS l_country,
            l.price AS l_price, l.currency AS l_currency, l.status AS l_status,
            l.owner_id AS l_owner_id, u.display_name AS l_owner_label
     FROM offers o
     JOIN users b ON b.id = o.buyer_id
     JOIN listings l ON l.id = o.listing_id
     JOIN users u ON u.id = l.owner_id
     WHERE o.buyer_id = $1 OR l.owner_id = $1
     ORDER BY o.updated_at DESC`,
    [req.user.id]
  );
  const offers = rows.map((r) => serialize(r, {
    id: r.l_id, title: r.l_title, zone: r.l_zone, country: r.l_country,
    price: r.l_price, currency: r.l_currency, status: r.l_status,
    owner_id: r.l_owner_id, owner_label: r.l_owner_label
  }, req.user.id));
  res.json({ offers });
});

function lastBid(offer) { return offer.bids[offer.bids.length - 1]; }

async function loadOfferWithListing(id) {
  const offer = await loadOffer(id);
  if (!offer) return null;
  const listing = await loadListing(offer.listing_id);
  return { offer, listing };
}

// POST /api/offers/:id/bids  { amount, message }  — counter-offer
router.post('/:id/bids', requireAuth, async (req, res) => {
  const found = await loadOfferWithListing(req.params.id);
  if (!found) return res.status(404).json({ error: 'no_encontrado', message: 'Esa oferta ya no existe.' });
  const { offer, listing } = found;
  const isBuyer = offer.buyer_id === req.user.id;
  const isSeller = listing.owner_id === req.user.id;
  if (!isBuyer && !isSeller) return res.status(403).json({ error: 'no_autorizado', message: 'No podés actuar sobre esta oferta.' });
  if (!ACTIVE_STATUSES.slice(0, 2).includes(offer.status)) {
    return res.status(400).json({ error: 'oferta_cerrada', message: 'Esta oferta ya no admite más movimientos.' });
  }
  const last = lastBid(offer);
  const myTurn = (last.by === 'comprador' && isSeller) || (last.by === 'vendedor' && isBuyer);
  if (!myTurn) return res.status(400).json({ error: 'no_es_tu_turno', message: 'Estás esperando la respuesta de la otra persona.' });

  const type = (req.body && req.body.type === 'trueque') ? 'trueque' : 'efectivo';
  const message = ((req.body && req.body.message) || '').trim().slice(0, 500);
  let amount = null;
  let description = null;
  if (type === 'trueque') {
    description = ((req.body && req.body.description) || '').trim().slice(0, 300);
    if (!description) return res.status(400).json({ error: 'descripcion_invalida', message: 'Contá qué ofrecés a cambio (ej: un vehículo, otro terreno).' });
  } else {
    amount = Number(req.body && req.body.amount);
    if (!(amount > 0)) return res.status(400).json({ error: 'monto_invalido', message: 'Ingresá un monto válido.' });
  }

  const bids = offer.bids.concat([{ by: isSeller ? 'vendedor' : 'comprador', type, amount, description, message, ts: Date.now() }]);
  const { rows } = await pool.query(
    `UPDATE offers SET bids = $1, status = 'contraoferta', updated_at = now() WHERE id = $2 RETURNING *`,
    [JSON.stringify(bids), offer.id]
  );
  res.json({ offer: serialize(rows[0], listing, req.user.id) });
});

async function resolveOffer(req, res, newStatus, { onlyNonLastBidder, onlyBuyer } = {}) {
  const found = await loadOfferWithListing(req.params.id);
  if (!found) return res.status(404).json({ error: 'no_encontrado', message: 'Esa oferta ya no existe.' });
  const { offer, listing } = found;
  const isBuyer = offer.buyer_id === req.user.id;
  const isSeller = listing.owner_id === req.user.id;
  if (!isBuyer && !isSeller) return res.status(403).json({ error: 'no_autorizado', message: 'No podés actuar sobre esta oferta.' });
  if (onlyBuyer && !isBuyer) return res.status(403).json({ error: 'no_autorizado', message: 'Solo quien ofertó puede hacer esto.' });
  if (!['pendiente', 'contraoferta'].includes(offer.status)) {
    return res.status(400).json({ error: 'oferta_cerrada', message: 'Esta oferta ya no admite más movimientos.' });
  }
  if (onlyNonLastBidder) {
    const last = lastBid(offer);
    const myTurn = (last.by === 'comprador' && isSeller) || (last.by === 'vendedor' && isBuyer);
    if (!myTurn) return res.status(400).json({ error: 'no_es_tu_turno', message: 'Estás esperando la respuesta de la otra persona.' });
  }
  const { rows } = await pool.query(
    `UPDATE offers SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [newStatus, offer.id]
  );
  if (newStatus === 'aceptada') {
    await pool.query(`UPDATE listings SET status = 'vendido' WHERE id = $1`, [listing.id]);
    listing.status = 'vendido';
  }
  res.json({ offer: serialize(rows[0], listing, req.user.id) });
}

router.post('/:id/accept', requireAuth, (req, res) => resolveOffer(req, res, 'aceptada', { onlyNonLastBidder: true }));
router.post('/:id/reject', requireAuth, (req, res) => resolveOffer(req, res, 'rechazada', { onlyNonLastBidder: true }));
router.post('/:id/withdraw', requireAuth, (req, res) => resolveOffer(req, res, 'retirada', { onlyBuyer: true }));

module.exports = router;
