# 06 — Supabase Architecture Plan

How Supabase should be used across the project.

---

## 1. Database

- **PostgreSQL** managed by Supabase — no self-hosting
- Schema defined via **SQL migrations** in `supabase/migrations/`
- Migrations version-controlled in the repo (checked into Git)
- Enums defined as PostgreSQL `CREATE TYPE` for strict validation
- Use Supabase CLI for local dev: `supabase start`, `supabase db push`, `supabase gen types`

---

## 2. Authentication

### Provider: Email + Password

- Use **Supabase Auth** built-in email/password authentication
- No third-party OAuth needed for MVP (can be added in Phase 3)
- Password reset via Supabase Auth built-in flow

### Registration Trigger

When a user signs up via Supabase Auth, a **database trigger** automatically creates their profile:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, full_name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Session Management

- Supabase handles JWT tokens and session refresh automatically
- Next.js middleware reads the session on every request via `@supabase/ssr`
- Session stored in HttpOnly cookies (secure, not accessible via JS)

---

## 3. Row-Level Security (RLS)

> **CRITICAL:** RLS must be enabled on ALL tables in production. This is the primary data access control mechanism.

### Strategy by Table

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `villages` | All authenticated | Admin | Admin | Admin |
| `labs` | All authenticated | Admin | Admin | Admin |
| `user_profiles` | Own profile; Admin sees all | Trigger only | Own profile; Admin edits all | Never |
| `item_master` | All authenticated | Admin | Admin | Never (soft delete) |
| `purchase_orders` | Own + village (Focal Point) + all (Admin) | Requester, Staff, Admin | Focal Point (approve/reject), Admin | Never |
| `item_lots` | Village-scoped + Admin sees all | Staff, Admin | Staff (checkout deduction), Admin | Never |
| `checkouts` | Village-scoped | Staff, Requester, Admin | Never | Never |
| `peroxide_inspections` | Village-scoped | Staff, Compliance, Admin | Never | Never |
| `shelf_life_extensions` | Village-scoped | Staff, Compliance, Admin | Compliance (approve/reject), Admin | Never |
| `regulatory_records` | Compliance, Admin | Compliance, Admin | Compliance, Admin | Never |
| `regulatory_record_lots` | Compliance, Admin | Compliance, Admin | Never | Compliance, Admin |
| `transactions` | Own + village (Focal Point) + all (Admin, Compliance) | System only (via triggers/service) | Never | Never |
| `system_settings` | All authenticated | Admin | Admin | Admin |

### Example RLS Policies

```sql
-- Enable RLS on purchase_orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Requesters see their own orders
CREATE POLICY "Requesters see own orders"
  ON purchase_orders FOR SELECT
  USING (
    requester_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Focal Points see their village's orders
CREATE POLICY "Focal points see village orders"
  ON purchase_orders FOR SELECT
  USING (
    village_id IN (
      SELECT village_id FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'focal_point'
    )
  );

-- Admins see everything
CREATE POLICY "Admins full access"
  ON purchase_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Requesters can create orders
CREATE POLICY "Requesters can create orders"
  ON purchase_orders FOR INSERT
  WITH CHECK (
    requester_id = (
      SELECT id FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role IN ('requester', 'staff', 'admin')
    )
  );

-- Focal Points can update orders (approve/reject)
CREATE POLICY "Focal points can approve/reject"
  ON purchase_orders FOR UPDATE
  USING (
    village_id IN (
      SELECT village_id FROM user_profiles
      WHERE auth_user_id = auth.uid() AND role IN ('focal_point', 'admin')
    )
  );
```

---

## 4. Storage

- **Not required for MVP**
- Phase 3 usage:
  - `sds-files` bucket — Safety Data Sheet file uploads
  - `exports` bucket — Generated report files (CSV, PDF)
  - `avatars` bucket — User profile pictures

---

## 5. API Usage

- **Supabase PostgREST** (auto-generated REST API) handles all standard CRUD operations
- Use `@supabase/supabase-js` client library for all queries
- For complex operations, use **Supabase RPC functions** (PostgreSQL functions called via `supabase.rpc()`):
  - `generate_po_number(village_code, year)` — atomic PO number generation
  - `perform_checkout(lot_id, quantity, user_id, purpose)` — atomic checkout with quantity validation
  - `record_inspection(lot_id, ppm, inspector_id)` — auto-classify and optionally quarantine

- **No custom REST API endpoints needed** for most operations
- Use Next.js **Route Handlers** only for:
  - Complex multi-table operations
  - Admin-only operations requiring service role key

---

## 6. Server/Client Usage Strategy in Next.js

| Context | How to Create Client | Use Case |
|---|---|---|
| **Server Components** | `createServerClient()` from `@supabase/ssr` using `cookies()` | Initial page data fetching, SSR |
| **Route Handlers** | `createRouteHandlerClient()` from `@supabase/ssr` | API endpoints, complex server operations |
| **Middleware** | `createMiddlewareClient()` from `@supabase/ssr` | Auth checks, redirect logic on every request |
| **Client Components** | `createBrowserClient()` from `@supabase/ssr` | Interactive forms, real-time subscriptions, client-side data fetching |
| **Server Actions** | Service role client (bypasses RLS) | Admin operations like user approval |

### Key Rules

1. **Never expose the service role key** to the client — only use it in server-side code
2. **Always use RLS** as the primary security layer — application-level filtering is a secondary check
3. **Prefer Server Components** for initial data loading (better performance, SEO)
4. **Use Client Components** only when interactivity is needed (forms, real-time updates)
5. **Single Supabase provider** wraps the entire app — manages session refresh

### Supabase Client Setup Files

```
src/lib/supabase/
├── client.ts      → createBrowserClient() for Client Components
├── server.ts      → createServerClient() for Server Components
├── middleware.ts   → createMiddlewareClient() for Next.js middleware
└── admin.ts        → createClient() with service role key for admin operations
```
