-- 006: Create item_lots table

CREATE TABLE item_lots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID NOT NULL REFERENCES purchase_orders(id),
  item_id             UUID NOT NULL REFERENCES item_master(id),
  village_id          UUID NOT NULL REFERENCES villages(id),
  lab_id              UUID NOT NULL REFERENCES labs(id),
  lot_number          TEXT NOT NULL,
  received_quantity   NUMERIC NOT NULL,
  remaining_quantity  NUMERIC NOT NULL,
  unit                TEXT NOT NULL,
  manufacture_date    DATE,
  expiry_date         DATE,
  received_date       DATE NOT NULL,
  received_by         UUID NOT NULL REFERENCES user_profiles(id),
  supplier            TEXT,
  is_peroxide         BOOLEAN NOT NULL DEFAULT false,
  status              lot_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_lots_village_id          ON item_lots (village_id);
CREATE INDEX idx_item_lots_item_id             ON item_lots (item_id);
CREATE INDEX idx_item_lots_purchase_order_id   ON item_lots (purchase_order_id);
CREATE INDEX idx_item_lots_status              ON item_lots (status);
