const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
const MAX_LEN = 2000;

// GET /api/messages/threads — one row per person you've exchanged messages with,
// most recent first, with an unread count and (if any) the listing it started from.
router.get('/threads', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.*, us.display_name AS sender_name, ur.display_name AS recipient_name, l.title AS listing_title
     FROM messages m
     JOIN users us ON us.id = m.sender_id
     JOIN users ur ON ur.id = m.recipient_id
     LEFT JOIN listings l ON l.id = m.listing_id
     WHERE m.sender_id = $1 OR m.recipient_id = $1
     ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  const threads = new Map();
  for (const row of rows) {
    const mine = row.sender_id === req.user.id;
    const otherId = mine ? row.recipient_id : row.sender_id;
    const otherName = mine ? row.recipient_name : row.sender_name;
    if (!threads.has(otherId)) {
      threads.set(otherId, {
        otherUserId: otherId,
        otherUserName: otherName,
        lastMessage: row.body,
        lastAt: row.created_at,
        lastMine: mine,
        listingTitle: row.listing_title || null,
        unread: 0
      });
    }
    if (!mine && !row.read_at) threads.get(otherId).unread++;
  }
  res.json({ threads: Array.from(threads.values()) });
});

// GET /api/messages/unread-count — lightweight, for the nav badge.
router.get('/unread-count', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS c FROM messages WHERE recipient_id = $1 AND read_at IS NULL',
    [req.user.id]
  );
  res.json({ count: rows[0].c });
});

// GET /api/messages/thread/:otherUserId — full conversation with one person; marks it read.
router.get('/thread/:otherUserId', requireAuth, async (req, res) => {
  const otherId = Number(req.params.otherUserId);
  if (!Number.isInteger(otherId)) {
    return res.status(400).json({ error: 'usuario_invalido', message: 'Usuario inválido.' });
  }
  const otherUserRows = await pool.query('SELECT id, display_name FROM users WHERE id = $1', [otherId]);
  if (!otherUserRows.rows.length) {
    return res.status(404).json({ error: 'usuario_no_encontrado', message: 'Ese usuario ya no existe.' });
  }
  const { rows } = await pool.query(
    `SELECT m.*, l.title AS listing_title
     FROM messages m LEFT JOIN listings l ON l.id = m.listing_id
     WHERE (m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1)
     ORDER BY m.created_at ASC`,
    [req.user.id, otherId]
  );
  await pool.query(
    'UPDATE messages SET read_at = now() WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL',
    [req.user.id, otherId]
  );
  res.json({
    otherUser: { id: otherUserRows.rows[0].id, displayName: otherUserRows.rows[0].display_name },
    messages: rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      recipientId: r.recipient_id,
      body: r.body,
      createdAt: r.created_at,
      listingId: r.listing_id,
      listingTitle: r.listing_title,
      mine: r.sender_id === req.user.id
    }))
  });
});

// POST /api/messages — send a message, optionally attached to a listing for context.
router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const toUserId = Number(b.toUserId);
  const body = (b.body || '').trim();
  const listingId = b.listingId ? Number(b.listingId) : null;

  if (!Number.isInteger(toUserId) || toUserId === req.user.id) {
    return res.status(400).json({ error: 'destinatario_invalido', message: 'Destinatario inválido.' });
  }
  if (!body || body.length > MAX_LEN) {
    return res.status(400).json({ error: 'mensaje_invalido', message: 'Escribí un mensaje (hasta 2000 caracteres).' });
  }
  const target = await pool.query('SELECT id FROM users WHERE id = $1', [toUserId]);
  if (!target.rows.length) {
    return res.status(404).json({ error: 'usuario_no_encontrado', message: 'Ese usuario ya no existe.' });
  }
  if (listingId != null) {
    const lRows = await pool.query('SELECT id FROM listings WHERE id = $1', [listingId]);
    if (!lRows.rows.length) {
      return res.status(404).json({ error: 'lote_no_encontrado', message: 'Ese lote ya no existe.' });
    }
  }
  const { rows } = await pool.query(
    'INSERT INTO messages (sender_id, recipient_id, listing_id, body) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.user.id, toUserId, listingId, body]
  );
  res.status(201).json({
    message: {
      id: rows[0].id,
      senderId: rows[0].sender_id,
      recipientId: rows[0].recipient_id,
      body: rows[0].body,
      createdAt: rows[0].created_at,
      listingId: rows[0].listing_id,
      mine: true
    }
  });
});

module.exports = router;
