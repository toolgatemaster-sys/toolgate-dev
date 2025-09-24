# Day 7 — Context (UI Approvals — Phase 1)

**Goal:** Build the first UI for Approvals using **shadcn/ui** components and wire it to existing backend APIs.  
**Scope:** Frontend only (no backend changes). **Use shadcn/ui** exclusively for UI primitives.  
**Keep:** Day 4–6 behavior intact.

## Previously (Day 6)
- Backend supports approvals with retry/idempotency and webhooks.
- API endpoints:
  - GET `/api/approvals?status=&agentId=`
  - POST `/api/approvals/:id/approve`
  - POST `/api/approvals/:id/deny`

## Today (Day 7)
- Create an **Approvals** tab/page with:
  - Table (id, status, agentId, tool, domain, createdAt, expiresAt, actions).
  - Filters: `status` (select), `agentId` (input).
  - Actions per row: **Approve**, **Deny**.
  - Polling toggle (10–15s) and manual Refresh button.
  - Toaster feedback on success/error.
- Tests: render, filtering, approve/deny action, polling triggers refetch.

**Deliverables must respect the Day 7 cage.**
