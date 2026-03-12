# 10 — Implementation Order

Exact build sequence. Each step should be completed and tested before moving to the next.

---

## Phase 1 — MVP (Steps 1–13)

### Step 1: Project Scaffolding

**What to do:**
- Initialize Next.js project with TypeScript (`npx -y create-next-app@latest ./`)
- Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `recharts`, `lucide-react`, `date-fns`, `clsx`
- Set up Tailwind CSS v4
- Create folder structure as defined in `07-frontend-architecture.md`
- Create design system in `globals.css` (colors, typography, spacing, dark mode tokens)
- Create `.env.local.example` with Supabase URLs

**Deliverable:** Empty project that builds and runs with `npm run dev`

---

### Step 2: Supabase Schema & Migrations

**What to do:**
- Create Supabase project (or use existing)
- Write all SQL migration files in `supabase/migrations/`:
  - Enums (001)
  - Villages & labs (002)
  - User profiles (003)
  - Item master (004)
  - Purchase orders (005)
  - Item lots (006)
  - Checkouts (007)
  - Peroxide inspections (008)
  - Shelf life extensions (009)
  - Regulatory records + junction (010)
  - Transactions (011)
  - System settings (012)
  - RLS policies (013)
  - Triggers & functions (014)
  - Seed data (015)
- Run migrations against Supabase
- Generate TypeScript types: `supabase gen types typescript`

**Deliverable:** Database fully created with all tables, indexes, triggers, and seed data. Types generated in `src/types/database.types.ts`.

---

### Step 3: Supabase Client Setup

**What to do:**
- Create `src/lib/supabase/client.ts` (browser client)
- Create `src/lib/supabase/server.ts` (server component client)
- Create `src/lib/supabase/middleware.ts` (middleware client)
- Create `src/lib/supabase/admin.ts` (service role client)
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (server-only)

**Deliverable:** All 4 Supabase clients working and tested.

---

### Step 4: Authentication — Login & Register

**What to do:**
- Create `(auth)` route group with centered layout
- Build `/login` page with `LoginForm` component
- Build `/register` page with `RegisterForm` component
  - Village/lab dropdowns fetched from Supabase
  - On submit: `supabase.auth.signUp()` with user metadata
- Build `/pending-approval` page with status display
- Create `src/middleware.ts` with auth guard logic
- Create `useAuth` hook (session state, sign in, sign out)
- Create `useUser` hook (current user profile from `user_profiles`)
- Create `api/auth/callback/route.ts` for Supabase auth callback

**Deliverable:** Users can register (account created in pending state), log in (blocked if pending), and sign out.

---

### Step 5: UI Primitives

**What to do:**
- Build all shared UI components in `src/components/ui/`:
  - Button, Input, Select, Textarea, Modal, Badge, Card
  - DataTable, Pagination, Tabs
  - LoadingSpinner, ErrorBanner, EmptyState, Toast
  - SearchInput, DatePicker, ConfirmDialog
- Establish consistent styling, animations, hover effects

**Deliverable:** Complete UI component library ready for feature pages.

---

### Step 6: App Shell — Sidebar & Layout

**What to do:**
- Build `Sidebar.tsx` — collapsible, role-based navigation items
- Build `TopNav.tsx` — search bar, user menu, notification bell (placeholder)
- Build `AppLayout.tsx` — responsive wrapper
- Create `(protected)/layout.tsx` — uses AppLayout, auth guard
- Create `usePermissions` hook for role-based nav visibility
- Create `useVillageScope` hook for village context

**Deliverable:** Full app shell with sidebar navigation. Clicking nav items routes to pages (which can be placeholder for now).

---

### Step 7: Admin — User Management

**What to do:**
- Build `/admin/users` page
- Build `PendingUsersQueue` component (highlighted section for pending accounts)
- Build `UserTable` component (all users with status, role, village)
- Implement approve/reject actions (via API route or server action using service role)
- Create `users.service.ts` (fetchUsers, approveUser, rejectUser, updateRole)

**Deliverable:** Admin can approve/reject pending users and assign roles.

---

### Step 8: Admin — Master Data

**What to do:**
- Build `/admin/items` page with `ItemMasterForm` and `ItemMasterTable`
- Build `/admin/villages` page with `VillageLabManager`
- Create `master-data.service.ts` (fetchItems, createItem, updateItem, fetchVillages, fetchLabs, createVillage, createLab)

**Deliverable:** Admin can manage the item catalog and village/lab structure.

---

### Step 9: Dashboard

**What to do:**
- Build `/dashboard` page
- Build dashboard widgets: `KpiCard`, `PendingApprovalsWidget`, `RecentTransactions`
- KPIs: total orders, pending approvals, available stock items, peroxide warnings
- Fetch aggregated data from Supabase
- Village-scoped data filtering

**Deliverable:** Working dashboard with live KPIs and widgets.

---

### Step 10: Order Request & Approval

**What to do:**
- Build `/orders/new` page with `OrderForm`
- Build `/orders` page with `OrderTable` and `OrderDetail`
- Build `/approvals` page with `ApprovalQueue`, `ApprovalDetail`, `RejectReasonModal`
- Create `orders.service.ts` (createOrder, fetchOrders, approveOrder, rejectOrder)
- Implement PO number generation (database function `generate_po_number`)

**Deliverable:** Complete order → approval → PO number generation workflow.

---

### Step 11: Check-in & Check-out

**What to do:**
- Build `/check-in` page with `CheckInForm`
- Build `/check-out` page with `CheckOutForm` and `StockProgressBar`
- Create `inventory.service.ts` (checkIn, checkOut, fetchLots)
- Implement atomic checkout (RPC function or database transaction)
- Validate quantity constraints

**Deliverable:** Staff can receive against POs (creating lots) and consume from lots.

---

### Step 12: Village Inventory

**What to do:**
- Build `/inventory` page with `InventoryTable` and `LotDetail`
- Village tabs or selector
- Category filtering
- Show remaining quantities with progress bars
- Low stock highlighting

**Deliverable:** Users can browse village-scoped inventory.

---

### Step 13: Transaction History

**What to do:**
- Build `/transactions` page
- Search bar (name, user, ID, reference)
- Type filter pills with counts
- Date range filter
- Paginated table (12 per page)
- Create `transactions.service.ts` (fetchTransactions)

**Deliverable:** Full audit log searchable and filterable. Phase 1 MVP complete.

---

## Phase 2 — Safety & Compliance (Steps 14–18)

### Step 14: Peroxide Monitoring

**What to do:**
- Build `/peroxide` page with `InspectionForm`, `StatusTiles`, `InspectionHistory`
- Auto-classification logic (PPM → status)
- Quarantine action workflow
- Create `peroxide.service.ts`

### Step 15: Shelf Life Extension

**What to do:**
- Build `/shelf-life` page with `ShelfLifeForm`, `ShelfLifeTable`
- Request + approval workflow
- Lot expiry date update on approval
- Create `compliance.service.ts`

### Step 16: Regulatory Records

**What to do:**
- Build `/regulatory` page with `RegulatoryForm`, `RegulatoryTable`
- Lot linking via junction table
- Status management (Active/Expired/Pending Review)

### Step 17: Enhanced Dashboard

**What to do:**
- Add `TrendChart` (Recharts area chart — order & check-in trends)
- Add `LowStockWidget` (items below min_stock_level)
- Add `PeroxideAlerts` widget (warning + quarantine lots)

### Step 18: Settings

**What to do:**
- Build `/settings` page (user profile, password change, notification toggles)
- Build `/admin/settings` page (PPM thresholds, PO format, system info)
- Create `settings.service.ts`

---

## Phase 3 — Advanced (Steps 19–20+)

### Step 19: Notifications

- In-app notification system (notification bell + drawer)
- Email notifications via Supabase Edge Functions or external service

### Step 20: Export & Reports

- CSV export for transactions, inventory, compliance
- PDF PO printout

### Future Steps:
- File attachments (Supabase Storage)
- Real-time updates (Supabase Realtime)
- Advanced analytics
- Barcode/QR support
- Mobile-optimized layouts
