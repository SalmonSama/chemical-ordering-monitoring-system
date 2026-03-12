-- 008: Create peroxide_inspections table

CREATE TABLE peroxide_inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id          UUID NOT NULL REFERENCES item_lots(id),
  inspection_date DATE NOT NULL,
  ppm_reading     NUMERIC NOT NULL,
  status          inspection_status NOT NULL,
  inspector_id    UUID NOT NULL REFERENCES user_profiles(id),
  notes           TEXT,
  action_taken    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_peroxide_inspections_lot_id ON peroxide_inspections (lot_id);
