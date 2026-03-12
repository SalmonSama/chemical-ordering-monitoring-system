-- 013: Enable Row-Level Security and define policies

-- Helper function: get the current user's profile id from auth.uid()
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: get the current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql STABLE
AS $$
  SELECT role FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: get the current user's village_id
CREATE OR REPLACE FUNCTION get_current_user_village_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT village_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

-- Helper function: check if current user is active
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid() AND status = 'active'
  );
$$;

-- =============================================================
-- villages: readable by all active users
-- =============================================================
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Villages: active users can read"
  ON villages FOR SELECT
  USING (is_active_user());

CREATE POLICY "Villages: admin can manage"
  ON villages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================
-- labs: readable by all active users
-- =============================================================
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labs: active users can read"
  ON labs FOR SELECT
  USING (is_active_user());

CREATE POLICY "Labs: admin can manage"
  ON labs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================
-- user_profiles: users see their own profile; admin sees all
-- =============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: user can read own"
  ON user_profiles FOR SELECT
  USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "Profiles: user can update own (limited)"
  ON user_profiles FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Profiles: insert allowed (sign-up trigger)"
  ON user_profiles FOR INSERT
  WITH CHECK (auth_user_id = auth.uid() OR is_admin());

-- Admin can update any profile (for approval/role assignment — done via service role)

-- =============================================================
-- item_master: readable by active users; managed by admin
-- =============================================================
ALTER TABLE item_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items: active users can read active items"
  ON item_master FOR SELECT
  USING (is_active_user() AND is_active = true);

CREATE POLICY "Items: admin can manage all"
  ON item_master FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================
-- purchase_orders: village-scoped
-- =============================================================
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POs: users see their village's orders"
  ON purchase_orders FOR SELECT
  USING (
    is_active_user() AND (
      is_admin() OR
      village_id = get_current_user_village_id()
    )
  );

CREATE POLICY "POs: requester can create"
  ON purchase_orders FOR INSERT
  WITH CHECK (
    is_active_user() AND
    requester_id = get_current_profile_id()
  );

CREATE POLICY "POs: focal point / admin can update (approve/reject)"
  ON purchase_orders FOR UPDATE
  USING (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() = 'focal_point'
    )
  );

-- =============================================================
-- item_lots: village-scoped
-- =============================================================
ALTER TABLE item_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lots: users see their village's lots"
  ON item_lots FOR SELECT
  USING (
    is_active_user() AND (
      is_admin() OR
      village_id = get_current_user_village_id()
    )
  );

CREATE POLICY "Lots: staff / admin can insert (check-in)"
  ON item_lots FOR INSERT
  WITH CHECK (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() IN ('staff', 'focal_point')
    )
  );

CREATE POLICY "Lots: staff / admin can update (checkout deducts qty)"
  ON item_lots FOR UPDATE
  USING (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() IN ('staff', 'focal_point')
    )
  );

-- =============================================================
-- checkouts: village-scoped via lot
-- =============================================================
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checkouts: active users can read their village's"
  ON checkouts FOR SELECT
  USING (is_active_user());

CREATE POLICY "Checkouts: active users can insert"
  ON checkouts FOR INSERT
  WITH CHECK (
    is_active_user() AND
    checked_out_by = get_current_profile_id()
  );

-- =============================================================
-- peroxide_inspections
-- =============================================================
ALTER TABLE peroxide_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Peroxide: active users can read"
  ON peroxide_inspections FOR SELECT
  USING (is_active_user());

CREATE POLICY "Peroxide: active users can record inspections"
  ON peroxide_inspections FOR INSERT
  WITH CHECK (
    is_active_user() AND
    inspector_id = get_current_profile_id()
  );

-- =============================================================
-- shelf_life_extensions
-- =============================================================
ALTER TABLE shelf_life_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ShelfLife: active users can read"
  ON shelf_life_extensions FOR SELECT
  USING (is_active_user());

CREATE POLICY "ShelfLife: active users can request"
  ON shelf_life_extensions FOR INSERT
  WITH CHECK (
    is_active_user() AND
    requested_by = get_current_profile_id()
  );

CREATE POLICY "ShelfLife: compliance / admin can update (approve)"
  ON shelf_life_extensions FOR UPDATE
  USING (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() = 'compliance'
    )
  );

-- =============================================================
-- regulatory_records
-- =============================================================
ALTER TABLE regulatory_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regulatory: active users can read"
  ON regulatory_records FOR SELECT
  USING (is_active_user());

CREATE POLICY "Regulatory: compliance / admin can manage"
  ON regulatory_records FOR ALL
  USING (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() = 'compliance'
    )
  )
  WITH CHECK (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() = 'compliance'
    )
  );

-- =============================================================
-- regulatory_record_lots
-- =============================================================
ALTER TABLE regulatory_record_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RegLots: active users can read"
  ON regulatory_record_lots FOR SELECT
  USING (is_active_user());

CREATE POLICY "RegLots: compliance / admin can manage"
  ON regulatory_record_lots FOR ALL
  USING (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() = 'compliance'
    )
  )
  WITH CHECK (
    is_active_user() AND (
      is_admin() OR
      get_current_user_role() = 'compliance'
    )
  );

-- =============================================================
-- transactions: read-only (insert via service role / triggers)
-- =============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transactions: active users can read their village's"
  ON transactions FOR SELECT
  USING (
    is_active_user() AND (
      is_admin() OR
      village_id = get_current_user_village_id()
    )
  );

-- No INSERT policy — transactions are written via service role or DB triggers only.

-- =============================================================
-- system_settings: readable by active users; writable by admin
-- =============================================================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings: active users can read"
  ON system_settings FOR SELECT
  USING (is_active_user());

CREATE POLICY "Settings: admin can manage"
  ON system_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
