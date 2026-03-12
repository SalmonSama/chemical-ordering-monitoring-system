# 05 — Database Schema

All tables use **PostgreSQL** via **Supabase**. Every table includes these default columns unless stated otherwise:

- `id` — UUID, primary key, default `gen_random_uuid()`
- `created_at` — timestamptz, default `now()`
- `updated_at` — timestamptz, default `now()` (updated via trigger)

---

## Enum Types

Create these PostgreSQL enums first, before any tables:

```sql
CREATE TYPE user_role AS ENUM ('admin', 'requester', 'focal_point', 'staff', 'compliance');

CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected', 'inactive');

CREATE TYPE item_category AS ENUM ('chemical_reagent', 'calibration_std', 'gas', 'material_supply', 'peroxide');

CREATE TYPE order_status AS ENUM ('pending', 'approved', 'rejected', 'ordered', 'partially_received', 'received', 'closed');

CREATE TYPE lot_status AS ENUM ('active', 'depleted', 'expired', 'quarantined', 'disposed');

CREATE TYPE inspection_status AS ENUM ('normal', 'warning', 'quarantine');

CREATE TYPE extension_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE regulatory_status AS ENUM ('active', 'expired', 'pending_review');

CREATE TYPE transaction_type AS ENUM (
  'order_created', 'order_approved', 'order_rejected',
  'check_in', 'check_out', 'inspection',
  'shelf_life_extension', 'regulatory_update', 'user_approved'
);
```

---

## Table: `villages`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `name` | text | NOT NULL | e.g., "AIE", "MTP", "CT", "ATC" |
| `code` | text | NOT NULL, UNIQUE | Short code |
| `description` | text | | |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

---

## Table: `labs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `village_id` | UUID | FK → `villages.id`, NOT NULL | Parent village |
| `name` | text | NOT NULL | Lab name |
| `code` | text | NOT NULL, UNIQUE | Short code |
| `location` | text | | Physical location |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

---

## Table: `user_profiles`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `auth_user_id` | UUID | FK → `auth.users.id`, UNIQUE, NOT NULL | Links to Supabase Auth |
| `full_name` | text | NOT NULL | |
| `email` | text | NOT NULL | |
| `role` | user_role | | NULL until admin assigns |
| `village_id` | UUID | FK → `villages.id` | |
| `lab_id` | UUID | FK → `labs.id` | |
| `status` | user_status | NOT NULL, default `'pending'` | |
| `approved_by` | UUID | FK → `user_profiles.id` | Admin who approved |
| `approved_at` | timestamptz | | |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

**Trigger:** `on_auth_user_created` → auto-inserts a row here with `status = 'pending'`

---

## Table: `item_master`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `name` | text | NOT NULL | Chemical/material name |
| `cas_number` | text | | CAS registry number (nullable for non-chemicals) |
| `category` | item_category | NOT NULL | |
| `unit` | text | NOT NULL | e.g., "L", "kg", "pcs", "cylinder" |
| `is_peroxide` | boolean | NOT NULL, default `false` | Peroxide-forming chemical flag |
| `is_regulated` | boolean | NOT NULL, default `false` | Regulatory-controlled flag |
| `min_stock_level` | numeric | | Minimum stock threshold |
| `storage_requirements` | text | | Storage instructions |
| `is_active` | boolean | NOT NULL, default `true` | Soft delete flag |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

---

## Table: `purchase_orders`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `po_number` | text | UNIQUE | Generated on approval: `PO-{VILLAGE}-{YEAR}-{SEQ}` |
| `item_id` | UUID | FK → `item_master.id`, NOT NULL | |
| `village_id` | UUID | FK → `villages.id`, NOT NULL | |
| `lab_id` | UUID | FK → `labs.id`, NOT NULL | |
| `quantity` | numeric | NOT NULL | Requested quantity |
| `unit` | text | NOT NULL | |
| `purpose` | text | | Reason for request |
| `requester_id` | UUID | FK → `user_profiles.id`, NOT NULL | |
| `status` | order_status | NOT NULL, default `'pending'` | |
| `approved_by` | UUID | FK → `user_profiles.id` | |
| `approved_at` | timestamptz | | |
| `reject_reason` | text | | Required when status = 'rejected' |
| `notes` | text | | |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

**Database Function:** `generate_po_number(village_code, year)` → returns next sequential PO number

---

## Table: `item_lots`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `purchase_order_id` | UUID | FK → `purchase_orders.id`, NOT NULL | Which PO was received |
| `item_id` | UUID | FK → `item_master.id`, NOT NULL | |
| `village_id` | UUID | FK → `villages.id`, NOT NULL | |
| `lab_id` | UUID | FK → `labs.id`, NOT NULL | |
| `lot_number` | text | NOT NULL | Supplier lot number |
| `received_quantity` | numeric | NOT NULL | Qty received |
| `remaining_quantity` | numeric | NOT NULL | Current remaining qty |
| `unit` | text | NOT NULL | |
| `manufacture_date` | date | | |
| `expiry_date` | date | | |
| `received_date` | date | NOT NULL | |
| `received_by` | UUID | FK → `user_profiles.id`, NOT NULL | |
| `supplier` | text | | |
| `is_peroxide` | boolean | NOT NULL, default `false` | Inherited from item_master |
| `status` | lot_status | NOT NULL, default `'active'` | |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

---

## Table: `checkouts`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `lot_id` | UUID | FK → `item_lots.id`, NOT NULL | |
| `quantity` | numeric | NOT NULL | Quantity consumed |
| `purpose` | text | | |
| `checked_out_by` | UUID | FK → `user_profiles.id`, NOT NULL | |
| `checked_out_at` | timestamptz | NOT NULL, default `now()` | |
| `created_at` | timestamptz | default `now()` | |

---

## Table: `peroxide_inspections`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `lot_id` | UUID | FK → `item_lots.id`, NOT NULL | |
| `inspection_date` | date | NOT NULL | |
| `ppm_reading` | numeric | NOT NULL | Measured PPM value |
| `status` | inspection_status | NOT NULL | Auto-calculated from ppm_reading |
| `inspector_id` | UUID | FK → `user_profiles.id`, NOT NULL | |
| `notes` | text | | |
| `action_taken` | text | | For quarantine cases |
| `created_at` | timestamptz | default `now()` | |

---

## Table: `shelf_life_extensions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `lot_id` | UUID | FK → `item_lots.id`, NOT NULL | |
| `old_expiry_date` | date | NOT NULL | |
| `new_expiry_date` | date | NOT NULL | |
| `reason` | text | NOT NULL | |
| `requested_by` | UUID | FK → `user_profiles.id`, NOT NULL | |
| `approved_by` | UUID | FK → `user_profiles.id` | |
| `status` | extension_status | NOT NULL, default `'pending'` | |
| `review_date` | date | | |
| `reject_reason` | text | | |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

---

## Table: `regulatory_records`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `item_id` | UUID | FK → `item_master.id`, NOT NULL | |
| `regulation_type` | text | NOT NULL | e.g., "OSHA", "EPA", "GHS", "DOT" |
| `regulation_code` | text | | Specific regulation code |
| `status` | regulatory_status | NOT NULL, default `'active'` | |
| `effective_date` | date | | |
| `expiry_date` | date | | |
| `description` | text | | |
| `is_controlled` | boolean | NOT NULL, default `false` | |
| `village_id` | UUID | FK → `villages.id` | Nullable — may be global |
| `lab_id` | UUID | FK → `labs.id` | Nullable |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

---

## Table: `regulatory_record_lots` (Junction Table)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `regulatory_record_id` | UUID | FK → `regulatory_records.id`, NOT NULL | |
| `lot_id` | UUID | FK → `item_lots.id`, NOT NULL | |
| `created_at` | timestamptz | default `now()` | |

**Unique constraint:** (`regulatory_record_id`, `lot_id`)

---

## Table: `transactions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `type` | transaction_type | NOT NULL | |
| `reference_id` | UUID | NOT NULL | FK to the related entity (polymorphic) |
| `reference_type` | text | NOT NULL | Table name of the related entity |
| `description` | text | NOT NULL | Human-readable description |
| `user_id` | UUID | FK → `user_profiles.id`, NOT NULL | |
| `village_id` | UUID | FK → `villages.id` | |
| `metadata` | jsonb | | Additional structured data |
| `created_at` | timestamptz | default `now()` | |

**Note:** This table is **insert-only** — no updates or deletes allowed. Enforced via RLS policy.

---

## Table: `system_settings`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `key` | text | NOT NULL, UNIQUE | Setting key |
| `value` | jsonb | NOT NULL | Setting value |
| `description` | text | | |
| `created_at` | timestamptz | default `now()` | |
| `updated_at` | timestamptz | default `now()` | |

**Seed Data:**
- `ppm_threshold_warning`: `{"value": 30}`
- `ppm_threshold_quarantine`: `{"value": 100}`
- `po_number_format`: `{"prefix": "PO", "separator": "-"}`

---

## Table Relationship Summary

```
villages ──┬── labs ──── user_profiles
            │               │
            ├── purchase_orders ──── item_lots ──┬── checkouts
            │       │                             ├── peroxide_inspections
            │       │                             ├── shelf_life_extensions
            │       │                             └── regulatory_record_lots ── regulatory_records
            │       │
            │       └── item_master ── regulatory_records
            │
            └── transactions
```

### Table Count: 14 tables total
1. `villages`
2. `labs`
3. `user_profiles`
4. `item_master`
5. `purchase_orders`
6. `item_lots`
7. `checkouts`
8. `peroxide_inspections`
9. `shelf_life_extensions`
10. `regulatory_records`
11. `regulatory_record_lots`
12. `transactions`
13. `system_settings`

(Plus Supabase's built-in `auth.users`)

---

## Indexes to Create

```sql
-- Performance indexes
CREATE INDEX idx_user_profiles_auth_user_id ON user_profiles (auth_user_id);
CREATE INDEX idx_user_profiles_status ON user_profiles (status);
CREATE INDEX idx_user_profiles_village_id ON user_profiles (village_id);
CREATE INDEX idx_labs_village_id ON labs (village_id);
CREATE INDEX idx_purchase_orders_village_id ON purchase_orders (village_id);
CREATE INDEX idx_purchase_orders_requester_id ON purchase_orders (requester_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX idx_item_lots_village_id ON item_lots (village_id);
CREATE INDEX idx_item_lots_item_id ON item_lots (item_id);
CREATE INDEX idx_item_lots_purchase_order_id ON item_lots (purchase_order_id);
CREATE INDEX idx_item_lots_status ON item_lots (status);
CREATE INDEX idx_checkouts_lot_id ON checkouts (lot_id);
CREATE INDEX idx_peroxide_inspections_lot_id ON peroxide_inspections (lot_id);
CREATE INDEX idx_shelf_life_extensions_lot_id ON shelf_life_extensions (lot_id);
CREATE INDEX idx_regulatory_records_item_id ON regulatory_records (item_id);
CREATE INDEX idx_transactions_type ON transactions (type);
CREATE INDEX idx_transactions_village_id ON transactions (village_id);
CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_created_at ON transactions (created_at);
```
