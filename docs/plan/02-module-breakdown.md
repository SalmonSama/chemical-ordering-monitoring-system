# 02 — Module Breakdown

The system consists of **13 modules**. Each module is a self-contained feature area with its own pages, service logic, and database tables.

---

## Module 1: Authentication & User Management

- Sign in / Sign out via Supabase Auth (email + password)
- Self-service registration with **admin approval gate**
- User profile management (name, email, village, lab, role)
- Role assignment and management (Admin only)
- Account activation / deactivation

**Tables:** `user_profiles` (+ Supabase `auth.users`)

---

## Module 2: Master Data Management

- **Item Master** — central catalog shared across all villages
  - Categories: Chemicals/Reagents, Calibration STD, Gas, Material Supply/Consumables, Peroxide
  - Fields: name, CAS number, category, unit, is_peroxide flag, is_regulated flag, min stock level, storage requirements
- **Village Management** — CRUD for the 4 villages (AIE, MTP, CT, ATC)
- **Lab Management** — Labs nested under villages
- **User-to-Lab Assignment**

**Tables:** `item_master`, `villages`, `labs`

---

## Module 3: Order Request

- Create new order request for an item from the master catalog
- Auto-detect peroxide items and show safety warnings
- Select destination village/lab
- Specify quantity, unit, purpose
- Routes to village focal point for approval

**Tables:** `purchase_orders` (status = `pending`)

---

## Module 4: Approval Workflow

- Queue of pending orders for focal points
- Filter by status: Pending / Approved / Rejected
- Approve with optional notes
- Reject with mandatory reason
- Auto-generate PO number on approval (format: `PO-{VILLAGE}-{YEAR}-{SEQ}`)

**Tables:** `purchase_orders`

---

## Module 5: Purchase Orders

- Generated automatically upon approval
- Unique PO number per approved order
- PO status tracking: Open → Partially Received → Fully Received → Closed
- PO detail view with line items and receiving history

**Tables:** `purchase_orders`

---

## Module 6: Check-in (Receiving)

- Select an approved PO to receive against
- Record: lot number, quantity received, manufacture date, expiry date, supplier info
- Creates a new **Item Lot** in village inventory
- Partial receiving supported (multiple check-ins against one PO)
- Auto-flags peroxide lots for monitoring schedule

**Tables:** `item_lots`

---

## Module 7: Check-out (Consumption)

- Select a lot from village inventory (remaining qty > 0)
- Record: quantity consumed, purpose, date, user
- Deducts from lot remaining quantity
- Validation: cannot check out more than available
- Peroxide safety warning for peroxide lots

**Tables:** `checkouts`, `item_lots` (remaining_quantity updated)

---

## Module 8: Peroxide Monitoring

- Inspection schedule for all active peroxide lots
- Record inspection: date, PPM reading, inspector
- Auto-classification:
  - **Normal**: < 30 ppm
  - **Warning**: 30–100 ppm
  - **Quarantine**: > 100 ppm
- Visual dashboard with alert tiles
- Quarantine action triggers
- Inspection history per lot

**Tables:** `peroxide_inspections`, `item_lots`

---

## Module 9: Shelf Life Extension

- Request extension for a lot nearing expiry
- Fields: old expiry, new expiry, reason
- Approval workflow (Compliance role approves/rejects)
- On approval, updates the lot's `expiry_date`
- Audit trail of all extensions

**Tables:** `shelf_life_extensions`, `item_lots`

---

## Module 10: Regulatory / Compliance

- Regulatory records linked to items or specific lots
- Regulation type + code (e.g., OSHA, EPA, GHS)
- Status tracking: Active / Expired / Pending Review
- Controlled substance flagging
- Effective/expiry date management

**Tables:** `regulatory_records`, `regulatory_record_lots`

---

## Module 11: Transaction History

- Centralized audit log of **all** system events
- Types: Order Created, Approved, Rejected, Check-in, Check-out, Inspection, Shelf Life Extension, Regulatory Update
- Searchable, filterable, paginated
- Date range filtering
- Immutable — insert-only, no updates or deletes

**Tables:** `transactions`

---

## Module 12: Dashboard

- Village-scoped KPI cards (total orders, pending approvals, stock levels, peroxide warnings)
- Order & check-in trend chart (6-month area chart)
- Peroxide alert widget (quarantine + warning items)
- Recent transactions table
- Pending approvals widget
- Low stock alerts

**Tables:** Aggregated reads from `purchase_orders`, `item_lots`, `peroxide_inspections`, `transactions`

---

## Module 13: Village-Based Inventory

- Inventory view scoped to the selected village
- Stock levels per item per village
- Lot listing with remaining quantities
- Category-based filtering
- Low stock highlighting against `min_stock_level`

**Tables:** `item_lots`, `item_master`, `villages`
