-- 019: Add composite indexes for common query patterns
--
-- All indexes are created with CONCURRENTLY so they can be added to a live
-- database without locking the table.  Run this migration outside a
-- transaction block (i.e. do NOT wrap it in BEGIN/COMMIT) because
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction.
--
-- ── user_profiles.auth_user_id ─────────────────────────────────────────────
-- CRITICAL: Every RLS helper function (get_current_user_role, is_admin,
-- is_active_user, get_current_user_village_id) does a point lookup on
-- auth_user_id.  Without this index every row access on every RLS-protected
-- table does a sequential scan on user_profiles.

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_user_profiles_auth_user_id
  ON user_profiles (auth_user_id);

-- ── purchase_orders composite indexes ──────────────────────────────────────
-- Covers: dashboard "pending approvals" KPI, approvals page, dashboard widget
--   WHERE village_id = ? AND status = 'pending' ORDER BY created_at DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_purchase_orders_village_status_created
  ON purchase_orders (village_id, status, created_at DESC);

-- Covers: requester-scoped order list
--   WHERE requester_id = ? ORDER BY created_at DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_purchase_orders_requester_created
  ON purchase_orders (requester_id, created_at DESC);

-- ── item_lots composite indexes ────────────────────────────────────────────
-- Covers: inventory page (village + status filter, ordered by created_at DESC)
-- Also covers: dashboard get_dashboard_stats RPC (active_lots count)

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_item_lots_village_status_created
  ON item_lots (village_id, status, created_at DESC);

-- Covers: peroxide page & dashboard peroxide widget
--   WHERE is_peroxide = true AND status IN ('active','quarantined') AND village_id = ?

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_item_lots_peroxide_status_village
  ON item_lots (is_peroxide, status, village_id);

-- Covers: check-out page — active lots with remaining stock (FEFO ordering)
--   WHERE status = 'active' AND remaining_quantity > 0 ORDER BY expiry_date ASC

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_item_lots_active_expiry
  ON item_lots (status, expiry_date ASC)
  WHERE status = 'active' AND remaining_quantity > 0;

-- ── transactions composite indexes ────────────────────────────────────────
-- Covers: transactions page (most common: village + created_at pagination)
--   WHERE village_id = ? ORDER BY created_at DESC LIMIT n

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_transactions_village_created
  ON transactions (village_id, created_at DESC);

-- Covers: transactions page type filter + village scope
--   WHERE village_id = ? AND type = ? ORDER BY created_at DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_transactions_village_type_created
  ON transactions (village_id, type, created_at DESC);

-- ── peroxide_inspections ─────────────────────────────────────────────────
-- Covers: peroxide page history table ORDER BY inspection_date DESC LIMIT 50
-- and the get_dashboard_stats RPC peroxide_warnings count

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_peroxide_inspections_lot_date
  ON peroxide_inspections (lot_id, inspection_date DESC);
