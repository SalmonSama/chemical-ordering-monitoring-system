# 07 — Frontend Architecture Plan

Next.js project structure, components, services, and integration patterns.

---

## Project Structure

```
chemical-ordering-monitoring-system/
├── .env.local                          # NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
├── .env.local.example                  # Template for new developers
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts                  # Tailwind v4 config
├── docs/
│   └── plan/                           # This plan folder
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_create_enums.sql
│       ├── 002_create_villages_labs.sql
│       ├── 003_create_user_profiles.sql
│       ├── 004_create_item_master.sql
│       ├── 005_create_purchase_orders.sql
│       ├── 006_create_item_lots.sql
│       ├── 007_create_checkouts.sql
│       ├── 008_create_peroxide_inspections.sql
│       ├── 009_create_shelf_life_extensions.sql
│       ├── 010_create_regulatory.sql
│       ├── 011_create_transactions.sql
│       ├── 012_create_system_settings.sql
│       ├── 013_create_rls_policies.sql
│       ├── 014_create_triggers_functions.sql
│       └── 015_seed_data.sql
├── public/
│   ├── favicon.ico
│   └── logo.svg
└── src/
    ├── app/
    │   ├── layout.tsx                  # Root layout: font, theme, providers
    │   ├── page.tsx                    # Redirect to /dashboard
    │   ├── globals.css                 # Design system + Tailwind base
    │   │
    │   ├── (auth)/                     # Route group: public auth pages
    │   │   ├── layout.tsx              # Auth layout (centered, no sidebar)
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── register/
    │   │   │   └── page.tsx
    │   │   └── pending-approval/
    │   │       └── page.tsx
    │   │
    │   ├── (protected)/                # Route group: authenticated pages
    │   │   ├── layout.tsx              # Protected layout: auth guard + sidebar + topnav
    │   │   ├── dashboard/
    │   │   │   └── page.tsx
    │   │   ├── orders/
    │   │   │   ├── page.tsx            # Order list
    │   │   │   └── new/
    │   │   │       └── page.tsx        # New order request
    │   │   ├── approvals/
    │   │   │   └── page.tsx
    │   │   ├── purchase-orders/
    │   │   │   └── page.tsx
    │   │   ├── check-in/
    │   │   │   └── page.tsx
    │   │   ├── check-out/
    │   │   │   └── page.tsx
    │   │   ├── inventory/
    │   │   │   └── page.tsx
    │   │   ├── peroxide/
    │   │   │   └── page.tsx
    │   │   ├── shelf-life/
    │   │   │   └── page.tsx
    │   │   ├── regulatory/
    │   │   │   └── page.tsx
    │   │   ├── transactions/
    │   │   │   └── page.tsx
    │   │   ├── settings/
    │   │   │   └── page.tsx
    │   │   └── admin/
    │   │       ├── users/
    │   │       │   └── page.tsx
    │   │       ├── items/
    │   │       │   └── page.tsx
    │   │       ├── villages/
    │   │       │   └── page.tsx
    │   │       └── settings/
    │   │           └── page.tsx
    │   │
    │   └── api/
    │       ├── auth/
    │       │   └── callback/
    │       │       └── route.ts        # Supabase auth callback handler
    │       └── admin/
    │           └── approve-user/
    │               └── route.ts        # Admin user approval (service role)
    │
    ├── components/
    │   ├── ui/                         # Shared UI primitives (reusable across all pages)
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Textarea.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Card.tsx
    │   │   ├── DataTable.tsx           # Generic table with sorting, filtering
    │   │   ├── Pagination.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── ErrorBanner.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── Toast.tsx
    │   │   ├── Tabs.tsx
    │   │   ├── DatePicker.tsx
    │   │   ├── SearchInput.tsx
    │   │   └── ConfirmDialog.tsx
    │   │
    │   ├── layout/                     # App shell components
    │   │   ├── Sidebar.tsx             # Collapsible sidebar with role-based nav
    │   │   ├── TopNav.tsx              # Search bar, notifications, user menu
    │   │   └── AppLayout.tsx           # Responsive wrapper combining sidebar + topnav
    │   │
    │   ├── auth/                       # Auth-specific components
    │   │   ├── LoginForm.tsx
    │   │   ├── RegisterForm.tsx
    │   │   └── PendingStatus.tsx
    │   │
    │   ├── dashboard/                  # Dashboard widgets
    │   │   ├── KpiCard.tsx
    │   │   ├── TrendChart.tsx
    │   │   ├── PeroxideAlerts.tsx
    │   │   ├── PendingApprovalsWidget.tsx
    │   │   ├── RecentTransactions.tsx
    │   │   └── LowStockWidget.tsx
    │   │
    │   ├── orders/                     # Order-related components
    │   │   ├── OrderForm.tsx
    │   │   ├── OrderTable.tsx
    │   │   └── OrderDetail.tsx
    │   │
    │   ├── approvals/                  # Approval workflow components
    │   │   ├── ApprovalQueue.tsx
    │   │   ├── ApprovalDetail.tsx
    │   │   └── RejectReasonModal.tsx
    │   │
    │   ├── inventory/                  # Inventory & lot components
    │   │   ├── InventoryTable.tsx
    │   │   ├── LotDetail.tsx
    │   │   ├── CheckInForm.tsx
    │   │   ├── CheckOutForm.tsx
    │   │   └── StockProgressBar.tsx
    │   │
    │   ├── peroxide/                   # Peroxide monitoring components
    │   │   ├── InspectionForm.tsx
    │   │   ├── StatusTiles.tsx
    │   │   └── InspectionHistory.tsx
    │   │
    │   ├── compliance/                 # Compliance components
    │   │   ├── ShelfLifeForm.tsx
    │   │   ├── ShelfLifeTable.tsx
    │   │   ├── RegulatoryForm.tsx
    │   │   └── RegulatoryTable.tsx
    │   │
    │   └── admin/                      # Admin page components
    │       ├── UserTable.tsx
    │       ├── PendingUsersQueue.tsx
    │       ├── ItemMasterForm.tsx
    │       ├── ItemMasterTable.tsx
    │       ├── VillageLabManager.tsx
    │       └── SystemSettingsForm.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts               # createBrowserClient()
    │   │   ├── server.ts               # createServerClient()
    │   │   ├── middleware.ts            # createMiddlewareClient()
    │   │   └── admin.ts                # Service role client
    │   ├── constants.ts                # PPM thresholds, PO format, status labels, colors
    │   └── utils.ts                    # formatDate, formatCurrency, generateId, etc.
    │
    ├── hooks/
    │   ├── useAuth.ts                  # Auth state: user session, sign in, sign out
    │   ├── useUser.ts                  # Current user profile (role, village, lab)
    │   ├── useVillageScope.ts          # Active village context for data filtering
    │   ├── usePermissions.ts           # canAccess(page), canEdit(resource), canApprove()
    │   └── useToast.ts                 # Toast notification state
    │
    ├── services/                       # Data access layer (ALL Supabase queries go here)
    │   ├── auth.service.ts             # signIn, signUp, signOut, getSession
    │   ├── users.service.ts            # fetchUsers, approveUser, rejectUser, updateRole
    │   ├── master-data.service.ts      # fetchItems, createItem, updateItem, fetchVillages, fetchLabs
    │   ├── orders.service.ts           # createOrder, fetchOrders, approveOrder, rejectOrder
    │   ├── inventory.service.ts        # checkIn, checkOut, fetchLots, fetchInventory
    │   ├── peroxide.service.ts         # recordInspection, fetchInspections, fetchPeroxideLots
    │   ├── compliance.service.ts       # requestExtension, approveExtension, fetchRegulatory
    │   ├── transactions.service.ts     # fetchTransactions (read-only)
    │   └── settings.service.ts         # fetchSettings, updateSetting
    │
    ├── types/
    │   ├── database.types.ts           # Auto-generated: supabase gen types typescript
    │   ├── models.ts                   # App-level interfaces (User, Order, Lot, etc.)
    │   └── enums.ts                    # TS enums matching PostgreSQL enums
    │
    └── middleware.ts                   # Next.js middleware: auth guard + redirect logic
```

---

## Key Architectural Decisions

### 1. Route Groups

- **`(auth)/`** — Public pages (login, register, pending). Uses a centered auth layout without sidebar.
- **`(protected)/`** — Authenticated pages. Uses the full app layout with sidebar, topnav, and auth guard.
- The route groups use Next.js parenthesized folders — they affect layout nesting but NOT the URL path.

### 2. Service Layer Pattern

**Components NEVER call Supabase directly.** All data access goes through `services/`:

```typescript
// ❌ Wrong — component calls Supabase directly
const { data } = await supabase.from('purchase_orders').select('*');

// ✅ Right — component calls service function
const orders = await fetchOrders({ villageId, status: 'pending' });
```

Benefits:
- Single place to change queries
- Easier to mock for testing
- Can add caching, error handling, type mapping in one place

### 3. Type Safety

- Run `supabase gen types typescript --local > src/types/database.types.ts` after every migration
- All service functions use the generated types as input/output
- `models.ts` contains app-level types that may differ from raw database types (e.g., joined data)

### 4. Middleware Auth Logic

- Runs on every request to `(protected)/` routes
- Checks Supabase session → checks `user_profiles.status`
- Redirect matrix:
  - No session → `/login`
  - Pending/rejected → `/pending-approval`
  - Active → allow
  - Admin pages + non-admin role → `/dashboard`

### 5. Component Conventions

- **UI primitives** (`components/ui/`) are unstyled logic components with Tailwind classes
- **Feature components** (`components/orders/`, etc.) compose UI primitives for specific features
- **Pages** (`app/(protected)/*/page.tsx`) are thin wrappers that fetch data and render feature components
- Use **Server Components** for initial data fetching; **Client Components** only for interactive parts

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.2",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "recharts": "^2.12",
    "lucide-react": "^0.400",
    "date-fns": "^3",
    "clsx": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "tailwindcss": "^4",
    "supabase": "^1.200"
  }
}
```
