# 01 — System Overview

## What the System Is

A **multi-village lab inventory management platform** that handles the full lifecycle of chemical ordering, receiving, consumption, peroxide safety monitoring, shelf life management, and regulatory compliance.

## Main Business Purpose

- Centralize chemical/material procurement across 4 organizational villages (AIE, MTP, CT, ATC)
- Enforce approval workflows with full audit trails
- Track inventory at lot-level granularity per village/lab
- Monitor peroxide-forming chemicals for safety compliance
- Maintain regulatory records and shelf life extensions
- Provide dashboards and transaction history for operational visibility

## Main User Groups

| Role | Purpose |
|---|---|
| **Admin** | Manages users (approve/reject registrations), villages, labs, item master, system config |
| **Requester** | Creates order requests, checks out chemicals, views own transaction history |
| **Focal Point** | Reviews and approves/rejects order requests for their village |
| **Staff** | Performs check-in, check-out, peroxide inspections, daily lab operations |
| **Compliance / Regulatory** | Manages regulatory records, shelf life extensions, compliance reporting |

## High-Level Workflow

```
User Registration
  └─▶ Admin Approval ─▶ Login
                          └─▶ Order Request
                                └─▶ Focal Point Approval
                                      └─▶ PO Generated
                                            └─▶ Check-in (Receiving)
                                                  └─▶ Lot Created in Inventory
                                                        ├─▶ Check-out (Consumption)
                                                        ├─▶ Peroxide Inspection
                                                        ├─▶ Shelf Life Extension
                                                        └─▶ Regulatory Tracking
                                                              └─▶ All actions logged in Transaction History
```

## Key Architectural Constraints

- **Inventory is separated by village** — each village sees only its own stock
- **All villages share one central item master** — the catalog of chemicals/materials is global
- **Labs exist under villages** — hierarchical organization
- **Users belong to labs** — scoped to village via lab
- **Each village has focal points / approvers** — approval is village-scoped
- **Every purchase has a PO number** — generated on approval, unique per village per year
- **New accounts require admin approval** — registration creates a pending account; admin must activate before access
