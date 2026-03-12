-- 005: Create purchase_orders table + PO number generation function

CREATE TABLE purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number     TEXT UNIQUE,
  item_id       UUID NOT NULL REFERENCES item_master(id),
  village_id    UUID NOT NULL REFERENCES villages(id),
  lab_id        UUID NOT NULL REFERENCES labs(id),
  quantity      NUMERIC NOT NULL,
  unit          TEXT NOT NULL,
  purpose       TEXT,
  requester_id  UUID NOT NULL REFERENCES user_profiles(id),
  status        order_status NOT NULL DEFAULT 'pending',
  approved_by   UUID REFERENCES user_profiles(id),
  approved_at   TIMESTAMPTZ,
  reject_reason TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_orders_village_id    ON purchase_orders (village_id);
CREATE INDEX idx_purchase_orders_requester_id  ON purchase_orders (requester_id);
CREATE INDEX idx_purchase_orders_status        ON purchase_orders (status);

-- Function: generate a sequential PO number per village per year
-- Format: PO-{VILLAGE_CODE}-{YEAR}-{4-digit sequence}
CREATE OR REPLACE FUNCTION generate_po_number(p_village_code TEXT, p_year INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq    INT;
  v_prefix TEXT;
BEGIN
  v_prefix := 'PO-' || upper(p_village_code) || '-' || p_year::TEXT || '-';

  SELECT COUNT(*) + 1
  INTO   v_seq
  FROM   purchase_orders
  WHERE  po_number LIKE v_prefix || '%';

  RETURN v_prefix || lpad(v_seq::TEXT, 4, '0');
END;
$$;
