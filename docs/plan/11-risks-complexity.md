# 11 — Risks & Complexity

The hardest parts of the system and what must be designed carefully before coding.

---

## Risk 1: Row-Level Security (RLS) Policies

**Complexity: HIGH**

**What makes it hard:**
- Every table needs RLS policies for every role × every operation (SELECT, INSERT, UPDATE, DELETE)
- Multi-role, multi-village scoping creates complex `WHERE` clauses
- RLS policies that join to `user_profiles` can cause performance issues if not indexed
- Incorrect policies = data leaks between villages or unauthorized access

**Mitigation:**
- Design the full RLS policy matrix on paper before writing any SQL
- Create a helper function `get_user_role()` and `get_user_village_id()` to avoid repetitive subqueries
- Add indexes on `user_profiles(auth_user_id)`, `user_profiles(village_id)`, `user_profiles(role)`
- Test every policy with each role using Supabase's SQL editor: `SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claims = '{"sub": "user-uuid"}';`
- Write automated tests that verify: "User A in village AIE cannot see village MTP data"

---

## Risk 2: PO Number Generation

**Complexity: MEDIUM-HIGH**

**What makes it hard:**
- PO numbers must be unique, sequential per village per year (e.g., PO-AIE-2026-0001)
- Concurrent approvals could generate duplicate numbers
- Resetting the sequence at year boundaries

**Mitigation:**
- Use a **database function** with `pg_advisory_lock` for atomic generation:
  ```sql
  CREATE OR REPLACE FUNCTION generate_po_number(p_village_code text)
  RETURNS text AS $$
  DECLARE
    current_year text;
    next_seq int;
    po text;
  BEGIN
    current_year := to_char(now(), 'YYYY');
    -- Lock on a hash of village+year to prevent concurrent conflicts
    PERFORM pg_advisory_xact_lock(hashtext(p_village_code || current_year));
    
    SELECT COALESCE(MAX(
      CAST(split_part(po_number, '-', 4) AS int)
    ), 0) + 1
    INTO next_seq
    FROM purchase_orders
    WHERE po_number LIKE 'PO-' || p_village_code || '-' || current_year || '-%';
    
    po := 'PO-' || p_village_code || '-' || current_year || '-' || lpad(next_seq::text, 4, '0');
    RETURN po;
  END;
  $$ LANGUAGE plpgsql;
  ```
- Call via `supabase.rpc('generate_po_number', { p_village_code: 'AIE' })` during approval
- Test with concurrent approval simulations

---

## Risk 3: Account Approval Gap

**Complexity: MEDIUM**

**What makes it hard:**
- Supabase Auth sign-up succeeds immediately (user gets a valid JWT)
- But the app blocks access until `user_profiles.status = 'active'`
- Edge cases: user has session, tries to access API directly bypassing the UI
- Token refresh: what happens if admin changes status while user has active session?

**Mitigation:**
- **Middleware** checks `user_profiles.status` on every request (not just on login)
- **RLS policies** also check status — even if a user bypasses middleware, RLS blocks data access
- Example RLS addition:
  ```sql
  CREATE POLICY "Only active users can read"
    ON purchase_orders FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid() AND status = 'active'
      )
    );
  ```
- Sign-up should NOT send email confirmation (or use auto-confirm) since admin approval is the gate

---

## Risk 4: Village Data Scoping

**Complexity: MEDIUM**

**What makes it hard:**
- Every data query must be correctly scoped to the user's village
- Forgetting to scope one query → data leak
- Admin role needs to see all villages → different query path
- Focal Points and Staff see different subsets

**Mitigation:**
- **Primary defense: RLS** — enforce scoping at the database level
- **Secondary defense: Service layer** — always include `villageId` parameter
- Create a `useVillageScope()` hook that provides the current village context
- Code review checklist: "Does this query filter by village?"
- Admin queries use service role client (bypasses RLS) or have "admin sees all" RLS policies

---

## Risk 5: Atomic Check-out Operations

**Complexity: MEDIUM**

**What makes it hard:**
- Check-out must: (1) validate quantity ≤ remaining, (2) deduct from lot, (3) create checkout record
- If two users check out from the same lot simultaneously, remaining quantity could go negative
- Race condition between read and write

**Mitigation:**
- Use a **database function** (RPC) that performs the check-out atomically:
  ```sql
  CREATE OR REPLACE FUNCTION perform_checkout(
    p_lot_id uuid, p_quantity numeric, p_user_id uuid, p_purpose text
  ) RETURNS uuid AS $$
  DECLARE
    available numeric;
    checkout_id uuid;
  BEGIN
    -- Lock the row to prevent concurrent modification
    SELECT remaining_quantity INTO available
    FROM item_lots WHERE id = p_lot_id FOR UPDATE;
    
    IF available < p_quantity THEN
      RAISE EXCEPTION 'Insufficient quantity: available=%, requested=%', available, p_quantity;
    END IF;
    
    UPDATE item_lots
    SET remaining_quantity = remaining_quantity - p_quantity,
        status = CASE WHEN remaining_quantity - p_quantity = 0 THEN 'depleted' ELSE status END,
        updated_at = now()
    WHERE id = p_lot_id;
    
    INSERT INTO checkouts (lot_id, quantity, purpose, checked_out_by)
    VALUES (p_lot_id, p_quantity, p_purpose, p_user_id)
    RETURNING id INTO checkout_id;
    
    RETURN checkout_id;
  END;
  $$ LANGUAGE plpgsql;
  ```
- Client-side validation is for UX only; the database function is the source of truth

---

## Risk 6: Peroxide PPM Classification Consistency

**Complexity: LOW-MEDIUM**

**What makes it hard:**
- PPM thresholds must be consistent between:
  - Frontend (live preview as user types)
  - Backend (stored inspection status)
  - Dashboard (alert filtering)
- If thresholds change, all three must update

**Mitigation:**
- Store thresholds in `system_settings` table
- Fetch thresholds once on app load (or on peroxide page load)
- Use the same threshold values for both client-side preview and server-side classification
- Database function for inspection recording should also read from `system_settings`

---

## Risk 7: Migration Management

**Complexity: LOW-MEDIUM**

**What makes it hard:**
- Schema changes must be backward-compatible
- Production data must survive migrations
- Order of migrations matters (foreign keys depend on referenced tables)

**Mitigation:**
- Use **Supabase CLI** migration system with numbered files
- Never modify existing migration files — always create new ones
- Test migrations against a staging database with sample data before production
- Keep migrations idempotent where possible (e.g., `CREATE TABLE IF NOT EXISTS`)
- Document breaking changes in migration commit messages

---

## Summary: What to Design Before Coding

| Priority | Item | Design Before Step |
|---|---|---|
| 🔴 Critical | RLS policy matrix (every table × role × operation) | Step 2 (database) |
| 🔴 Critical | `generate_po_number()` database function | Step 2 (database) |
| 🔴 Critical | Middleware redirect matrix (auth states × routes) | Step 4 (auth) |
| 🟡 Important | `perform_checkout()` atomic function | Step 2 (database) |
| 🟡 Important | Village scoping query pattern | Step 6 (app shell) |
| 🟢 Nice-to-have | PPM threshold config strategy | Step 14 (peroxide) |
| 🟢 Nice-to-have | Transaction logging strategy (triggers vs. service) | Step 2 (database) |
