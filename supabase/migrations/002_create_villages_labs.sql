-- 002: Create villages and labs tables

CREATE TABLE villages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE labs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id  UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_labs_village_id ON labs (village_id);
