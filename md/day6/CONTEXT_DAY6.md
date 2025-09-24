# Day 6 — Context (Retry & Notifications)

**Goal:** Implement **Retry & Idempotency** (via `bodyHash`) and **Notifications** for approval state changes.  
**Scope:** Backend only (no UI).  
**Keep:** All Day 4 + Day 5 behavior and tests green.

## Previously (Day 5)
- In-memory approvals store.
- API routes: list, get, approve, deny (and stats if present).
- Enforcement: when policy returns `pending` → create approval → `202 { decision, approval_id, ttl_seconds }`.
- Tests: approvals + allowlist green.

## Today (Day 6)
### Retry / Idempotency
- Compute a **stable `bodyHash`** per request (string from the request body; identical payload → same hash).
- Enforcement must **reuse decision by bodyHash**:
  - If prior approval with same `bodyHash` is **approved** → **allow (200)**.
  - If **denied** or **expired** → **deny (403)**.
  - If **pending** → **202** with the **same** `approval_id`.
- If no approval exists for `bodyHash`, call `applyPolicy(ctx, action)` and, if `pending`, create a new approval.

### Notifications
- On approve/deny/expire, send a POST to `process.env.TOOLGATE_WEBHOOK_URL` (if set).
- Payload JSON: `{ id, status, agentId, ctx, ts }` (ts = Date.now()).
- Log failures, do not block the flow.

**Deliverables must respect the Day 6 cage.**
