# Day 5 — Implementation Guide

## 1) Store
Create `apps/gateway/src/approvals.store.ts`:
- In-memory Map
- Methods: `createApproval`, `getApproval`, `listApprovals`, `approve`, `deny`, `expireOld`
- Export `approvalsStore` and `startExpiryCron()`

## 2) Routes
Create `apps/gateway/src/approvals.routes.ts`:
- `GET /api/approvals`
- `GET /api/approvals/:id`
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/deny`

## 3) Enforcement
Edit `apps/gateway/src/enforcement.ts` (used in Day 4):
- In the `pending` branch:
  - `createApproval(...)`
  - Reply `202` with `{ decision:"pending", approval_id, ttl_seconds }`

## 4) Core helpers
Add `packages/core/approval.ts`:
- `genApprovalId()`
- `computeExpiresAt(createdAt, ttlSeconds)`

## 5) Wire-up (bootstrap)
In Gateway bootstrap (e.g., `apps/gateway/src/index.ts`):
```ts
import { registerEnforcement } from "./enforcement";
import { registerApprovalRoutes } from "./approvals.routes";
import { startExpiryCron } from "./approvals.store";

await registerEnforcement(app);
await registerApprovalRoutes(app);
startExpiryCron(); // optional
```

## 6) Tests (Vitest)
Create `apps/gateway/__tests__/approvals.test.ts` with cases:
1. pending → 202 + approval_id
2. approve → status flips, retry should allow (if harness supports it)
3. deny → status flips, retry gets denied
4. expire → status becomes expired
5. list filters work

> Keep Day 4 tests intact. Do **not** touch `apps/collector/__tests__`.
