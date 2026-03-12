-- 011: Create transactions audit log table

CREATE TABLE transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           transaction_type NOT NULL,
  reference_id   UUID NOT NULL,
  reference_type TEXT NOT NULL,
  description    TEXT NOT NULL,
  user_id        UUID NOT NULL REFERENCES user_profiles(id),
  village_id     UUID REFERENCES villages(id),
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions are insert-only — no updates or deletes.
CREATE INDEX idx_transactions_type        ON transactions (type);
CREATE INDEX idx_transactions_village_id  ON transactions (village_id);
CREATE INDEX idx_transactions_user_id     ON transactions (user_id);
CREATE INDEX idx_transactions_created_at  ON transactions (created_at DESC);
