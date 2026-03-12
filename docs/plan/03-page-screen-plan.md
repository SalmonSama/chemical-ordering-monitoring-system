# 03 — Page & Screen Plan

Every page in the system, organized by section.

---

## A. Authentication Pages

### `/login` — Sign In

| Field | Detail |
|---|---|
| **Purpose** | Authenticate existing users |
| **Users** | All (public) |
| **UI Sections** | Email field, password field, sign-in button, link to register, forgot password link |
| **Actions** | Sign in via Supabase Auth → redirect to `/dashboard` (if active) or `/pending-approval` (if pending) |
| **Data** | `auth.users`, `user_profiles` |

### `/register` — Request Account

| Field | Detail |
|---|---|
| **Purpose** | New user self-registration |
| **Users** | Public (unauthenticated) |
| **UI Sections** | Full name, email, password, confirm password, village dropdown, lab dropdown (filtered by village), preferred role dropdown |
| **Actions** | Submit registration → Supabase Auth account created → `user_profiles` row with `status = 'pending'` → redirect to `/pending-approval` |
| **Data** | `auth.users`, `user_profiles`, `villages`, `labs` |

### `/pending-approval` — Waiting Screen

| Field | Detail |
|---|---|
| **Purpose** | Shown to users whose account is not yet approved |
| **Users** | Newly registered (pending) users |
| **UI Sections** | Status message ("Your account is pending admin approval"), contact admin info, sign out button |
| **Actions** | Sign out, refresh status check |
| **Data** | `user_profiles.status` |

---

## B. Main Operational Pages

### `/dashboard` — Dashboard

| Field | Detail |
|---|---|
| **Purpose** | Overview of system state and KPIs |
| **Users** | All authenticated users (scoped to their village) |
| **UI Sections** | KPI cards (total orders, pending approvals, stock level, peroxide warnings), order & check-in trend chart (6-month), peroxide alerts widget, recent transactions table, pending approvals widget, low stock alerts |
| **Actions** | Click through to detailed pages |
| **Data** | Aggregated from `purchase_orders`, `item_lots`, `peroxide_inspections`, `transactions` |

### `/orders/new` — Order Request

| Field | Detail |
|---|---|
| **Purpose** | Create a new order request |
| **Users** | Requester, Staff, Admin |
| **UI Sections** | Item search/select from master catalog (with CAS number, category, peroxide flag), quantity + unit input, purpose field, destination village/lab selector, peroxide safety warning (conditional) |
| **Actions** | Submit order → creates `purchase_orders` row with `status = 'pending'` |
| **Data** | `item_master`, `villages`, `labs` |

### `/orders` — Order List

| Field | Detail |
|---|---|
| **Purpose** | View all orders with status filtering |
| **Users** | All authenticated (scoped: own orders for Requester, village orders for Focal Point, all for Admin) |
| **UI Sections** | Filter bar (status tabs, date range, village filter), order table (PO#, item, requester, status, date), order detail side panel |
| **Actions** | View order detail, navigate to approval |
| **Data** | `purchase_orders`, `item_master`, `user_profiles` |

### `/approvals` — Approval Queue

| Field | Detail |
|---|---|
| **Purpose** | Review and approve/reject pending orders |
| **Users** | Focal Point, Admin |
| **UI Sections** | Pending orders list (filterable), order detail panel (item info, requester, purpose, quantity), approve button, reject button + reason modal |
| **Actions** | Approve → generates PO number, sets `status = 'approved'`; Reject → sets `status = 'rejected'` with reason |
| **Data** | `purchase_orders`, `user_profiles` |

### `/purchase-orders` — Purchase Orders

| Field | Detail |
|---|---|
| **Purpose** | View all POs with receiving status |
| **Users** | Staff, Focal Point, Admin |
| **UI Sections** | PO table (PO#, item, status, dates, qty ordered vs received), PO detail view, receiving history per PO |
| **Actions** | View detail, navigate to check-in |
| **Data** | `purchase_orders`, `item_lots` |

### `/check-in` — Check-in / Receiving

| Field | Detail |
|---|---|
| **Purpose** | Receive materials against approved POs |
| **Users** | Staff, Admin |
| **UI Sections** | PO selector dropdown (approved/partially received only), lot form (lot number, quantity, manufacture date, expiry date, supplier), recent receiving history table |
| **Actions** | Submit check-in → creates `item_lots` row, updates PO status |
| **Data** | `purchase_orders`, `item_lots` |

### `/check-out` — Check-out / Consumption

| Field | Detail |
|---|---|
| **Purpose** | Record material consumption from inventory |
| **Users** | Staff, Requester, Admin |
| **UI Sections** | Village/lab filter, lot selector (remaining qty > 0, with stock progress bar), checkout form (quantity, purpose), peroxide safety warning (conditional) |
| **Actions** | Submit checkout → creates `checkouts` row, deducts from `item_lots.remaining_quantity` |
| **Data** | `item_lots`, `checkouts` |

### `/inventory` — Village Inventory

| Field | Detail |
|---|---|
| **Purpose** | Browse current inventory by village |
| **Users** | All authenticated |
| **UI Sections** | Village tabs / selector, category filter, item/lot table (item name, lot#, received qty, remaining qty, expiry date, status), lot detail expandable rows |
| **Actions** | View lot details, navigate to check-out, navigate to peroxide inspection |
| **Data** | `item_lots`, `item_master`, `villages` |

### `/peroxide` — Peroxide Monitoring

| Field | Detail |
|---|---|
| **Purpose** | Inspect and monitor peroxide-forming chemicals |
| **Users** | Staff, Compliance, Admin |
| **UI Sections** | Active peroxide lots list (with last inspection date & status), threshold guide tiles (Normal/Warning/Quarantine), inspection form (date, PPM reading, notes), inspection history table (color-coded rows) |
| **Actions** | Submit inspection → auto-classifies status, creates `peroxide_inspections` row; quarantine actions for high-PPM lots |
| **Data** | `item_lots` (is_peroxide = true), `peroxide_inspections` |

### `/shelf-life` — Shelf Life Extension

| Field | Detail |
|---|---|
| **Purpose** | Request and manage shelf life extensions |
| **Users** | Staff, Compliance, Admin |
| **UI Sections** | Lot selector (lots nearing expiry), extension request form (new expiry date, reason), pending extensions queue, extension history table |
| **Actions** | Request extension → creates pending record; Approve → updates lot expiry; Reject → with reason |
| **Data** | `item_lots`, `shelf_life_extensions` |

### `/regulatory` — Regulatory Records

| Field | Detail |
|---|---|
| **Purpose** | Manage regulatory compliance records |
| **Users** | Compliance, Admin |
| **UI Sections** | Records table (regulation type, code, item, status, dates), record detail/edit form, linked lots section |
| **Actions** | Create/edit/archive regulatory records, link/unlink lots |
| **Data** | `regulatory_records`, `regulatory_record_lots`, `item_master` |

### `/transactions` — Transaction History

| Field | Detail |
|---|---|
| **Purpose** | Full audit trail of all system events |
| **Users** | All authenticated (scoped: own for Requester/Staff, village for Focal Point, all for Admin/Compliance) |
| **UI Sections** | Search bar (name, user, ID), type filter pills with counts, date range filter, paginated table (12 per page) |
| **Actions** | Search, filter, paginate |
| **Data** | `transactions` |

---

## C. Admin Pages

### `/admin/users` — User Management

| Field | Detail |
|---|---|
| **Purpose** | Manage all users; approve/reject pending registrations |
| **Users** | Admin only |
| **UI Sections** | Pending accounts queue (highlight), all users table (name, email, role, village, lab, status), role editor dropdown, activation toggle |
| **Actions** | Approve → `status = 'active'` + assign role; Reject → `status = 'rejected'`; Change role; Deactivate |
| **Data** | `user_profiles`, `auth.users` |

### `/admin/items` — Item Master Management

| Field | Detail |
|---|---|
| **Purpose** | CRUD for the central item catalog |
| **Users** | Admin only |
| **UI Sections** | Item table (name, CAS#, category, unit, flags), add/edit form, category filter, active/inactive toggle |
| **Actions** | Add item, edit item, deactivate item |
| **Data** | `item_master` |

### `/admin/villages` — Village & Lab Management

| Field | Detail |
|---|---|
| **Purpose** | Manage the 4 villages and their labs |
| **Users** | Admin only |
| **UI Sections** | Village list with expand/collapse, lab list per village, add/edit forms for both |
| **Actions** | Add/edit villages, add/edit labs under villages |
| **Data** | `villages`, `labs` |

### `/admin/settings` — System Settings

| Field | Detail |
|---|---|
| **Purpose** | System-wide configuration |
| **Users** | Admin only |
| **UI Sections** | PPM threshold config (normal/warning/quarantine cutoffs), PO number prefix/format config, system info panel |
| **Actions** | Update settings |
| **Data** | `system_settings` |

---

## D. User Settings

### `/settings` — User Settings

| Field | Detail |
|---|---|
| **Purpose** | Personal profile and preferences |
| **Users** | All authenticated |
| **UI Sections** | Profile card (name, email, village, lab, role), password change form, notification preferences (toggles), PPM threshold reference guide |
| **Actions** | Update profile, change password |
| **Data** | `user_profiles` |
