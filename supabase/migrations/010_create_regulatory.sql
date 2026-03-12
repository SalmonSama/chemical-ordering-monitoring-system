-- 010: Create regulatory_records and junction table

CREATE TABLE regulatory_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          UUID NOT NULL REFERENCES item_master(id),
  regulation_type  TEXT NOT NULL,
  regulation_code  TEXT,
  status           regulatory_status NOT NULL DEFAULT 'active',
  effective_date   DATE,
  expiry_date      DATE,
  description      TEXT,
  is_controlled    BOOLEAN NOT NULL DEFAULT false,
  village_id       UUID REFERENCES villages(id),
  lab_id           UUID REFERENCES labs(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_regulatory_records_item_id ON regulatory_records (item_id);

CREATE TABLE regulatory_record_lots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulatory_record_id  UUID NOT NULL REFERENCES regulatory_records(id) ON DELETE CASCADE,
  lot_id                UUID NOT NULL REFERENCES item_lots(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (regulatory_record_id, lot_id)
);
