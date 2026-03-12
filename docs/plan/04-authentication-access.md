# 04 — Authentication & Access Plan

## Authentication Flow

```
1. User visits /register
2. Fills form: name, email, password, village, lab, preferred role
3. Supabase Auth creates the auth account
4. Database trigger inserts user_profiles row with status = 'pending'
5. User redirected to /pending-approval
6. Admin sees new pending user in /admin/users
7. Admin reviews:
   ├── APPROVE → status = 'active', role assigned
   └── REJECT  → status = 'rejected'
8. Approved user can now log in and access the system
```

---

## How Pending Accounts Work

1. On registration, **Supabase Auth** creates the auth user (this always succeeds)
2. A **database trigger** (`on_auth_user_created`) automatically creates a corresponding row in `user_profiles` with:
   - `status = 'pending'`
   - `role = NULL` (or the requested role — admin assigns the final role)
   - `village_id` and `lab_id` from the registration form
3. The **Next.js middleware** runs on every protected route and:
   - Checks if the user is authenticated (Supabase session exists)
   - If yes, queries `user_profiles.status`
   - If `status = 'pending'` → redirect to `/pending-approval`
   - If `status = 'rejected'` → redirect to `/pending-approval` with rejection message
   - If `status = 'inactive'` → redirect to `/login` with deactivation message
   - If `status = 'active'` → allow access
4. The `/pending-approval` page shows a static waiting message with the user's current status

## How Admin Approval Works

1. Admin navigates to `/admin/users`
2. Sees a highlighted "Pending Accounts" section at the top
3. For each pending user, admin sees: name, email, requested village, requested lab, requested role
4. Admin can:
   - **Approve** → sets `status = 'active'`, assigns a role (may differ from requested role)
   - **Reject** → sets `status = 'rejected'`
5. On approval, a transaction record is created: `type = 'user_approved'`
6. The user's next login attempt (or page refresh) will succeed and redirect to `/dashboard`

## What Happens After Approval

- User can log in normally
- Sidebar and page access are filtered by role
- Village-scoped data is automatically filtered based on the user's `village_id`

---

## Roles

| Role | Code | Description |
|---|---|---|
| Admin | `admin` | Full system access, user management, system configuration |
| Requester | `requester` | Creates order requests, checks out chemicals, views own history |
| Focal Point | `focal_point` | Reviews and approves/rejects orders for their village |
| Staff | `staff` | Check-in, check-out, peroxide inspections, daily lab operations |
| Compliance | `compliance` | Regulatory records, shelf life extensions, compliance reporting |

---

## Role-Based Page Access Matrix

| Page | Admin | Focal Point | Staff | Requester | Compliance |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Order Request | ✅ | ❌ | ✅ | ✅ | ❌ |
| Order List | ✅ all | ✅ village | ✅ own | ✅ own | ✅ view |
| Approvals | ✅ | ✅ | ❌ | ❌ | ❌ |
| Purchase Orders | ✅ | ✅ | ✅ | ✅ own | ✅ view |
| Check-in | ✅ | ❌ | ✅ | ❌ | ❌ |
| Check-out | ✅ | ❌ | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ✅ | ✅ | ✅ |
| Peroxide Monitoring | ✅ | ❌ | ✅ | ❌ | ✅ |
| Shelf Life Extension | ✅ | ❌ | ✅ | ❌ | ✅ |
| Regulatory Records | ✅ | ❌ | ❌ | ❌ | ✅ |
| Transaction History | ✅ all | ✅ village | ✅ own | ✅ own | ✅ all |
| Admin: Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin: Items | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin: Villages | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin: Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| User Settings | ✅ | ✅ | ✅ | ✅ | ✅ |

**Scope Legend:**
- `✅` = full access
- `✅ all` = can see all records
- `✅ village` = can see their village's records
- `✅ own` = can see only their own records
- `✅ view` = read-only access
- `❌` = no access (page hidden from sidebar)

---

## Implementation Notes

### Middleware Auth Guard Logic (Next.js `middleware.ts`)

```
Request comes in:
  │
  ├── Is path /login or /register? → Allow (public)
  │
  ├── Has Supabase session? 
  │   ├── NO → Redirect to /login
  │   └── YES → Check user_profiles.status
  │       ├── 'pending' → Redirect to /pending-approval
  │       ├── 'rejected' → Redirect to /pending-approval
  │       ├── 'inactive' → Redirect to /login
  │       └── 'active' → Check role permissions
  │           ├── Role has access to this path? → Allow
  │           └── No access? → Redirect to /dashboard
  │
  └── Is path /pending-approval?
      ├── Has session + status is pending/rejected? → Allow
      └── Otherwise → Redirect appropriately
```

### Role Permission Check (Client-Side)

A `usePermissions` hook should be created that:
1. Reads the current user's role from context
2. Exposes helper functions: `canAccess(page)`, `canEdit(resource)`, `canApprove()`
3. Used by the sidebar to show/hide navigation items
4. Used by pages to show/hide action buttons
