# Day 5 — Context

Goal: Implement **Approvals** (in-memory) and connect the **pending** branch of the Gateway enforcement to create an approval and return `202` with `approval_id`.

**We are NOT touching UI today.** Backend-only.

## Previously (Day 4)
- Gateway enforcement hook (`preHandler`) calls `applyPolicy(ctx, action)`.
- Mapping: `allow` → continue; `deny` → 403.
- `pending` exists conceptually but not wired to approvals yet.
- Allowlist logic already tested in `apps/gateway/__tests__/allowlist.test.ts` (keep it green).

## Today (Day 5)
- Create an **in-memory approvals store**.
- Add **HTTP routes** to list, approve, deny, and get approvals.
- On `decision === "pending"`: create approval and return 202 with `approval_id` and `ttl_seconds`.
- Background expiry: mark pending approvals as expired after TTL (default 3600s).

Deliverables must respect the **cage**.
