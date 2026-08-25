-- Lote a Lote — esquema de base de datos
-- Se aplica de forma idempotente (CREATE TABLE IF NOT EXISTS) para poder
-- correr la migración en cada arranque sin romper datos existentes.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  phone         TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id           SERIAL PRIMARY KEY,
  owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'PY',
  zone         TEXT NOT NULL,
  price        NUMERIC NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'USD',
  phone        TEXT NOT NULL,
  description  TEXT NOT NULL,
  photos       JSONB NOT NULL DEFAULT '[]'::jsonb,
  status       TEXT NOT NULL DEFAULT 'activo',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id          SERIAL PRIMARY KEY,
  listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pendiente',
  bids        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id            SERIAL PRIMARY KEY,
  listing_id    INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  sender_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id           SERIAL PRIMARY KEY,
  owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT 'otros',
  title        TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'PY',
  zone         TEXT NOT NULL,
  price        NUMERIC,
  currency     TEXT NOT NULL DEFAULT 'USD',
  phone        TEXT NOT NULL,
  description  TEXT NOT NULL,
  photos       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS installments_paid INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS installments_left INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS installment_amount NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS total_paid NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS purchase_start_date DATE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS commission_accepted_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'terreno';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_country_zone ON listings(country, zone);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured_until);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, read_at);
CREATE INDEX IF NOT EXISTS idx_services_owner ON services(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_country_zone ON services(country, zone);
