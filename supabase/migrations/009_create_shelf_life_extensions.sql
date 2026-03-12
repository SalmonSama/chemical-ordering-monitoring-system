-- 009: Create shelf_life_extensions table

CREATE TABLE shelf_life_extensions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id          UUID NOT NULL REFERENCES item_lots(id),
  old_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  reason          TEXT NOT NULL,
  requested_by    UUID NOT NULL REFERENCES user_profiles(id),
  approved_by     UUID REFERENCES user_profiles(id),
  status          extension_status NOT NULL DEFAULT 'pending',
  review_date     DATE,
  reject_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shelf_life_extensions_lot_id ON shelf_life_extensions (lot_id);
