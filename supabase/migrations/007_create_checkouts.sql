-- 007: Create checkouts table + atomic checkout RPC function

CREATE TABLE checkouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id          UUID NOT NULL REFERENCES item_lots(id),
  quantity        NUMERIC NOT NULL,
  purpose         TEXT,
  checked_out_by  UUID NOT NULL REFERENCES user_profiles(id),
  checked_out_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkouts_lot_id ON checkouts (lot_id);

-- Atomic checkout function: deducts quantity from a lot in a single transaction.
-- Returns the new checkout record id.
CREATE OR REPLACE FUNCTION perform_checkout(
  p_lot_id   UUID,
  p_quantity NUMERIC,
  p_user_id  UUID,
  p_purpose  TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_remaining NUMERIC;
  v_checkout_id UUID;
BEGIN
  -- Lock the lot row for update
  SELECT remaining_quantity
  INTO   v_remaining
  FROM   item_lots
  WHERE  id = p_lot_id
    AND  status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot not found or not active';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  IF p_quantity > v_remaining THEN
    RAISE EXCEPTION 'Insufficient quantity. Available: %, Requested: %', v_remaining, p_quantity;
  END IF;

  -- Insert checkout record
  INSERT INTO checkouts (lot_id, quantity, purpose, checked_out_by)
  VALUES (p_lot_id, p_quantity, p_purpose, p_user_id)
  RETURNING id INTO v_checkout_id;

  -- Update remaining quantity (mark depleted if zero)
  UPDATE item_lots
  SET
    remaining_quantity = remaining_quantity - p_quantity,
    status = CASE WHEN remaining_quantity - p_quantity = 0 THEN 'depleted' ELSE status END,
    updated_at = now()
  WHERE id = p_lot_id;

  RETURN v_checkout_id;
END;
$$;
