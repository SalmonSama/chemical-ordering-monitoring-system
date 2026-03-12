-- 004: Create item_master table

CREATE TABLE item_master (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  cas_number           TEXT,
  category             item_category NOT NULL,
  unit                 TEXT NOT NULL,
  is_peroxide          BOOLEAN NOT NULL DEFAULT false,
  is_regulated         BOOLEAN NOT NULL DEFAULT false,
  min_stock_level      NUMERIC,
  storage_requirements TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
