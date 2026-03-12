# 09 — Phased Roadmap

What to build first, what comes later, and what is a future enhancement.

---

## MVP — Phase 1: Core System

> **Goal:** A working system where users can register, log in, create orders, get approvals, check in/out materials, and see a dashboard — all scoped to villages.

| Feature | What's Included |
|---|---|
| **Authentication** | Login, register, pending approval screen, sign out |
| **Admin: Users** | Approve/reject pending accounts, assign roles, activate/deactivate |
| **Admin: Item Master** | Add/edit/deactivate items in the central catalog |
| **Admin: Villages & Labs** | Setup the 4 villages and their labs |
| **Dashboard** | KPI cards (orders, approvals, stock, peroxide warnings), recent transactions |
| **Order Request** | Search item master, create order with quantity/purpose |
| **Approval Workflow** | Focal Points approve/reject orders for their village |
| **PO Generation** | Auto-generate PO number on approval |
| **Check-in** | Receive materials against approved POs, create lots |
| **Check-out** | Consume from lots, deduct remaining quantity |
| **Village Inventory** | Browse inventory by village, filter by category |
| **Transaction History** | Full audit log with search, type filter, date range, pagination |
| **Row-Level Security** | RLS on all tables, enforcing village + role scoping |
| **Middleware Auth Guard** | Redirect unauthenticated/pending users |

### What You Get After Phase 1
- Users can create accounts and get approved by admin
- Full order → approval → PO → check-in → check-out lifecycle works
- Village-scoped inventory is visible
- All actions are logged
- Data is secure via RLS

---

## Phase 2: Safety & Compliance

> **Goal:** Add peroxide monitoring, shelf life management, regulatory tracking, and enhanced dashboard features.

| Feature | What's Included |
|---|---|
| **Peroxide Monitoring** | Inspection form, PPM auto-classification, quarantine workflow, inspection history |
| **Shelf Life Extension** | Request form, approval workflow (Compliance role), lot expiry update |
| **Regulatory Records** | CRUD for regulatory records, lot linking via junction table |
| **Enhanced Dashboard** | Trend charts (order & check-in 6-month area chart), low stock alerts widget |
| **User Settings** | Profile management, password change, notification preferences (UI) |
| **Admin: System Settings** | PPM threshold configuration, PO format settings |

### What You Get After Phase 2
- Full peroxide safety monitoring in place
- Shelf life management prevents use of expired materials
- Regulatory compliance tracking for audits
- Dashboard provides operational intelligence
- Users can manage their own profiles

---

## Phase 3: Advanced Features

> **Goal:** Polish the system with notifications, exports, file attachments, and real-time capabilities.

| Feature | What's Included |
|---|---|
| **In-App Notifications** | Notification bell with unread count, notifications drawer |
| **Email Notifications** | Email alerts for: new pending order, approval/rejection, peroxide quarantine |
| **Export / Reports** | CSV export for transactions, inventory, compliance records; PDF PO printout |
| **File Attachments** | SDS file upload per item (Supabase Storage), PO document attachments |
| **Real-time Updates** | Supabase Realtime for live dashboard updates, approval queue auto-refresh |
| **Advanced Analytics** | Consumption trends per item/village, cost tracking, village comparison charts |
| **Barcode / QR Support** | Lot label generation with QR codes, barcode scanning for check-out |
| **Mobile Responsive** | Optimized mobile layouts for warehouse/lab use (check-in/out on tablet) |

### What You Get After Phase 3
- Proactive notification system reduces missed approvals
- Export capability supports audits and reporting
- File management supports regulatory compliance
- Real-time features improve team coordination
- Mobile support enables warehouse operations

---

## Phase Summary

| Phase | Focus | Prerequisites |
|---|---|---|
| **Phase 1 (MVP)** | Core CRUD, auth, order lifecycle, inventory | None — first build |
| **Phase 2** | Safety & compliance modules | Phase 1 complete |
| **Phase 3** | UX polish, notifications, exports, mobile | Phase 2 complete |
