require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const { attachUser } = require('./auth');
const { migrate } = require('../scripts/migrate');

const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const offersRoutes = require('./routes/offers');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(express.json({ limit: '8mb' })); // photos travel as base64 in the JSON body
app.use(cookieParser());
app.use(attachUser);

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));
// Catch-all for client-side routes / a fresh load of any path: serve the SPA shell.
// (Uses app.use instead of a '*' route because Express 5's router no longer accepts
// a bare '*' wildcard path.)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'no_encontrado' });
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'error_servidor', message: 'Algo salió mal. Probá de nuevo en un momento.' });
});

const PORT = process.env.PORT || 3000;

migrate(pool)
  .then(() => {
    app.listen(PORT, () => console.log(`Lote a Lote escuchando en el puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo migrar la base de datos:', err);
    process.exit(1);
  });
