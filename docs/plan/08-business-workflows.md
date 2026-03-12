# 08 — Business Workflows

End-to-end flows for every major operation in the system.

---

## Workflow 1: User Registration & Admin Approval

### Actors: New User, Admin

```
Step 1: New user visits /register
Step 2: Fills form:
        - Full name
        - Email
        - Password + confirm password
        - Village (dropdown)
        - Lab (dropdown, filtered by selected village)
        - Preferred role (dropdown)
Step 3: Form submits → Supabase Auth creates account
Step 4: Database trigger fires → inserts user_profiles row:
        - auth_user_id = new auth user ID
        - full_name, email = from form
        - village_id, lab_id = from form
        - status = 'pending'
        - role = NULL (admin will assign)
Step 5: User redirected to /pending-approval
        - Shows: "Your account is pending admin approval"
        - Button: Sign Out
Step 6: Admin navigates to /admin/users
        - Sees highlighted "Pending Accounts" section
        - Each pending user shows: name, email, village, lab
Step 7: Admin clicks user → reviews details
Step 8: Admin chooses:
        ├── APPROVE → Admin assigns role → status = 'active'
        │   - approved_by = admin's user_profiles.id
        │   - approved_at = now()
        │   - Transaction: type = 'user_approved', reference_id = user_profiles.id
        │
        └── REJECT → status = 'rejected'
Step 9: Next time user visits any page:
        - If active → full access based on role
        - If rejected → /pending-approval shows rejection message
```

---

## Workflow 2: Order Request

### Actors: Requester (or Staff, Admin)

```
Step 1: User navigates to /orders/new
Step 2: Searches item master catalog
        - Search by name, CAS number, or category
        - Results show: name, CAS#, category, unit, peroxide flag
Step 3: Selects an item
        - If item is_peroxide = true → safety warning appears
Step 4: Fills order form:
        - Quantity
        - Unit (pre-filled from item_master)
        - Purpose / reason
        - Destination lab (pre-filled from user's lab, editable)
Step 5: Submits order
Step 6: System creates purchase_orders row:
        - item_id, village_id, lab_id from form
        - requester_id = current user's profile ID
        - status = 'pending'
        - po_number = NULL (generated on approval)
Step 7: Transaction created:
        - type = 'order_created'
        - reference_id = purchase_orders.id
        - description = "Order created for {item_name} x{qty}"
Step 8: Order appears in:
        - User's order list (/orders)
        - Village focal point's approval queue (/approvals)
        - Dashboard pending approvals widget
```

---

## Workflow 3: Approval Process

### Actors: Focal Point (or Admin)

```
Step 1: Focal Point navigates to /approvals
Step 2: Sees list of pending orders for their village
        - Sorted by date (oldest first)
        - Shows: item name, requester, quantity, purpose, date
Step 3: Clicks an order to see detail panel
        - Full item info (CAS#, category, peroxide flag)
        - Requester info (name, lab)
        - Purpose / justification
Step 4a: APPROVE
        - Clicks "Approve" button
        - System generates PO number: PO-{VILLAGE_CODE}-{YEAR}-{SEQ}
          (e.g., PO-AIE-2026-0001)
        - Updates purchase_orders:
          - status = 'approved'
          - po_number = generated number
          - approved_by = focal point's profile ID
          - approved_at = now()
        - Transaction created: type = 'order_approved'
Step 4b: REJECT
        - Clicks "Reject" button → reason modal appears
        - Must enter rejection reason (required field)
        - Updates purchase_orders:
          - status = 'rejected'
          - reject_reason = entered reason
        - Transaction created: type = 'order_rejected'
Step 5: Order status updates everywhere:
        - Requester sees updated status in /orders
        - Dashboard updates pending count
```

---

## Workflow 4: Purchase Order Flow

### Actors: Staff, Focal Point, Admin

```
Step 1: Approved order has a PO number → appears in /purchase-orders
Step 2: PO has status lifecycle:
        pending → approved → partially_received → received → closed
Step 3: PO detail shows:
        - PO number
        - Item details
        - Ordered quantity
        - Total received quantity (sum of all check-ins)
        - Remaining to receive
        - List of check-in records (lots received)
Step 4: Staff performs check-in against this PO (see Workflow 5)
Step 5: PO status auto-updates:
        - If total received < ordered → 'partially_received'
        - If total received >= ordered → 'received'
        - Manual close available for Admin
```

---

## Workflow 5: Check-in (Receiving)

### Actors: Staff, Admin

```
Step 1: Staff navigates to /check-in
Step 2: Selects a PO from dropdown
        - Only shows POs with status: 'approved' or 'partially_received'
        - Dropdown shows: PO#, item name, qty ordered, qty remaining
Step 3: Fills receiving form:
        - Lot number (supplier's lot number)
        - Quantity received
        - Manufacture date
        - Expiry date
        - Supplier name
Step 4: Submits check-in
Step 5: System creates item_lots row:
        - purchase_order_id = selected PO
        - item_id = from PO
        - village_id, lab_id = from PO
        - lot_number, received_quantity, remaining_quantity = from form
        - received_by = current user's profile ID
        - is_peroxide = inherited from item_master
        - status = 'active'
Step 6: PO status updated based on total received vs ordered
Step 7: Transaction created:
        - type = 'check_in'
        - reference_id = item_lots.id
        - description = "Checked in lot {lot_number}: {qty} {unit} of {item_name}"
Step 8: If is_peroxide = true:
        - Lot appears in /peroxide for monitoring
        - Dashboard peroxide alerts may update
```

---

## Workflow 6: Check-out (Consumption)

### Actors: Staff, Requester, Admin

```
Step 1: User navigates to /check-out
Step 2: Village/lab auto-selected from user's profile
Step 3: Sees available lots:
        - Only lots where remaining_quantity > 0 and status = 'active'
        - Shows: item name, lot#, remaining qty, expiry date
        - Stock progress bar (remaining / received)
Step 4: Selects a lot
        - If is_peroxide = true → safety warning displayed
Step 5: Fills checkout form:
        - Quantity (validated: must be <= remaining_quantity)
        - Purpose
Step 6: Submits checkout
Step 7: System creates checkouts row:
        - lot_id, quantity, purpose
        - checked_out_by = current user's profile ID
        - checked_out_at = now()
Step 8: System updates item_lots:
        - remaining_quantity = remaining_quantity - checkout quantity
        - If remaining_quantity = 0 → status = 'depleted'
Step 9: Transaction created:
        - type = 'check_out'
        - reference_id = checkouts.id
        - description = "Checked out {qty} {unit} of {item_name} from lot {lot_number}"

NOTE: Steps 7-8 should be atomic (database transaction or RPC function)
      to prevent race conditions.
```

---

## Workflow 7: Peroxide Inspection

### Actors: Staff, Compliance

```
Step 1: User navigates to /peroxide
Step 2: Sees list of active peroxide lots:
        - Item name, lot#, last inspection date, last PPM, current status
        - Highlighted by status: green (normal), amber (warning), red (quarantine)
Step 3: PPM threshold guide displayed:
        - Normal: < 30 ppm
        - Warning: 30 – 100 ppm
        - Quarantine: > 100 ppm
Step 4: Selects a lot for inspection
Step 5: Fills inspection form:
        - Inspection date (default: today)
        - PPM reading (numeric input)
        - Notes (optional)
Step 6: Live preview:
        - As user types PPM, shows predicted status classification
Step 7: Submits inspection
Step 8: System creates peroxide_inspections row:
        - lot_id, inspection_date, ppm_reading
        - status = auto-classified from ppm_reading
        - inspector_id = current user's profile ID
Step 9: If status = 'quarantine':
        - item_lots.status → 'quarantined'
        - User prompted for action_taken field
        - Dashboard peroxide alert updates
Step 10: Transaction created:
        - type = 'inspection'
        - reference_id = peroxide_inspections.id
        - description = "Peroxide inspection: {ppm} ppm ({status}) for lot {lot_number}"
```

---

## Workflow 8: Shelf Life Extension

### Actors: Staff (request), Compliance (approve)

```
Step 1: User navigates to /shelf-life
Step 2: Sees lots nearing expiry (within 30 days or already expired)
Step 3: Selects a lot for extension request
Step 4: Fills extension form:
        - Current expiry date (read-only, from lot)
        - New expiry date (date picker)
        - Reason (required text)
Step 5: Submits request
Step 6: System creates shelf_life_extensions row:
        - lot_id, old_expiry_date, new_expiry_date, reason
        - requested_by = current user's profile ID
        - status = 'pending'
Step 7: Compliance / Admin sees pending extensions in /shelf-life approval queue
Step 8a: APPROVE
        - Updates shelf_life_extensions:
          - status = 'approved'
          - approved_by = reviewer's profile ID
          - review_date = today
        - Updates item_lots.expiry_date = new_expiry_date
        - Transaction: type = 'shelf_life_extension'
Step 8b: REJECT
        - Updates shelf_life_extensions:
          - status = 'rejected'
          - reject_reason = entered reason
          - review_date = today
        - Transaction: type = 'shelf_life_extension' (with rejection metadata)
```

---

## Workflow 9: Regulatory Tracking

### Actors: Compliance, Admin

```
Step 1: Compliance navigates to /regulatory
Step 2: Sees table of all regulatory records:
        - Filterable by regulation type, status, item
Step 3: CREATE new record:
        - Select item from item_master
        - Enter: regulation_type, regulation_code
        - Enter: effective_date, expiry_date
        - Enter: description
        - Set: is_controlled flag
        - Optionally: scope to a village/lab
Step 4: LINK lots:
        - After creating a regulatory record, link specific lots
        - Creates rows in regulatory_record_lots junction table
Step 5: EDIT record:
        - Update status: Active → Expired → Pending Review
        - Update dates, description
Step 6: Transaction created on every change:
        - type = 'regulatory_update'
        - reference_id = regulatory_records.id
```

---

## Workflow 10: Transaction History Logging

### How it works:

```
Every business action in the system creates a transaction record:

TRIGGER-BASED (recommended for reliability):
  - Database triggers on insert/update to key tables
  - Automatically creates transactions row
  - Cannot be bypassed or forgotten

SERVICE-BASED (alternative):
  - Service layer functions explicitly create transaction records
  - More flexible metadata
  - Risk: developer may forget to add logging

RECOMMENDED: Database triggers for core actions, service-based for metadata-rich entries.

Transaction record structure:
  - type: what happened (enum)
  - reference_id: UUID of the related entity
  - reference_type: table name (for polymorphic lookup)
  - description: human-readable summary
  - user_id: who did it
  - village_id: which village context
  - metadata: JSONB for extra data (old values, new values, etc.)

Transaction records are IMMUTABLE — insert-only, never updated or deleted.
This is enforced via RLS: no UPDATE or DELETE policies on the transactions table.
```
