# Lab Inventory / Chemical Ordering / Peroxide Monitoring System

## Complete System Plan

This folder contains the full system architecture plan for building the **Lab Inventory / Chemical Ordering / Peroxide Monitoring System** — a production-grade, multi-village lab management platform.

---

### How to Use This Plan

Each numbered file covers one planning area. Read them **in order** — they build on each other. If handing this to an AI model for implementation, provide the entire `docs/plan/` folder as context.

### Plan Documents

| # | File | Topic |
|---|---|---|
| 01 | [System Overview](01-system-overview.md) | What the system is, business purpose, user groups, high-level workflow |
| 02 | [Module Breakdown](02-module-breakdown.md) | All 13 modules and what each one does |
| 03 | [Page & Screen Plan](03-page-screen-plan.md) | Every page in the system with purpose, users, UI sections, actions, data |
| 04 | [Authentication & Access](04-authentication-access.md) | Login, registration, admin approval flow, role-based permissions |
| 05 | [Database Schema](05-database-schema.md) | All PostgreSQL tables, columns, relationships |
| 06 | [Supabase Architecture](06-supabase-architecture.md) | Auth, RLS, storage, API, server/client strategy |
| 07 | [Frontend Architecture](07-frontend-architecture.md) | Next.js project structure, components, services, types |
| 08 | [Business Workflows](08-business-workflows.md) | End-to-end flows for every major operation |
| 09 | [Phased Roadmap](09-phased-roadmap.md) | MVP vs Phase 2 vs Phase 3 |
| 10 | [Implementation Order](10-implementation-order.md) | Exact build sequence, step-by-step |
| 11 | [Risks & Complexity](11-risks-complexity.md) | Hardest parts, mitigation strategies |
| 12 | [Final Recommendation](12-final-recommendation.md) | Architecture decisions, rollout timeline, key principles |

---

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| API | Supabase PostgREST + Next.js Server Actions |
| Security | Row-Level Security (RLS) |
| Hosting | Vercel (recommended) |

### Villages

The system supports 4 organizational villages: **AIE**, **MTP**, **CT**, **ATC**

### Item Categories

- Chemicals / Reagents
- Calibration STD
- Gas
- Material Supply / Consumables
- Peroxide
