-- 018: Replace COUNT+LIKE PO number generation with a race-safe counter table
--
-- Problem: The original generate_po_number() did:
--   SELECT COUNT(*) + 1 ... WHERE po_number LIKE 'PO-{code}-{year}-%'
-- This is:
--   1) Slow — a sequential scan with LIKE on po_number
--   2) Race-unsafe — two concurrent approvals can get the same count → duplicate PO numbers
--
-- Solution: a dedicated counter table (one row per village+year) with
-- SELECT ... FOR UPDATE to guarantee atomic, gap-free sequence increments.

-- ── Counter table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS po_number_sequences (
  village_code  TEXT  NOT NULL,
  year          INT   NOT NULL,
  last_seq      INT   NOT NULL DEFAULT 0,
  PRIMARY KEY (village_code, year)
);

-- Only admins / focal-point users can read (via service-role writes only).
ALTER TABLE po_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PO sequences: admin can read"
  ON po_number_sequences FOR SELECT
  USING (is_admin());

-- The function itself runs as SECURITY DEFINER so it can bypass RLS
-- on this internal bookkeeping table.

-- ── Replacement PO number function ────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_po_number(p_village_code TEXT, p_year INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq    INT;
  v_prefix TEXT;
BEGIN
  v_prefix := 'PO-' || upper(p_village_code) || '-' || p_year::TEXT || '-';

  -- Upsert a row for this village+year, then lock it for the duration of
  -- this transaction.  Any concurrent call blocks here until we commit,
  -- guaranteeing each caller gets a unique, incrementing sequence number.
  INSERT INTO po_number_sequences (village_code, year, last_seq)
  VALUES (upper(p_village_code), p_year, 0)
  ON CONFLICT (village_code, year) DO NOTHING;

  -- Atomic increment — returns the NEW sequence value.
  UPDATE po_number_sequences
  SET    last_seq = last_seq + 1
  WHERE  village_code = upper(p_village_code)
    AND  year         = p_year
  RETURNING last_seq INTO v_seq;

  RETURN v_prefix || lpad(v_seq::TEXT, 4, '0');
END;
$$;

COMMENT ON FUNCTION generate_po_number IS
  'Generates a sequential, race-safe PO number using the po_number_sequences counter table.
   Format: PO-{VILLAGE_CODE}-{YEAR}-{4-digit sequence}.
   Replaces the previous COUNT(*)+LIKE approach that was slow and had a race condition.';
