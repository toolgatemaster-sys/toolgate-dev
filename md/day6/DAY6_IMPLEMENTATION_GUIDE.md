

# Day 6 — Implementation Guide

## 1) Core helper
- File: `packages/core/approval.ts`
- Add `hashBody(body: unknown): string`.

## 2) Store
- File: `apps/gateway/src/approvals.store.ts`
- Add `bodyHash` to `Approval.ctx`.
- Add index + `findByBodyHash(hash)`.

## 3) Enforcement
- File: `apps/gateway/src/enforcement.ts`
- Compute `bodyHash`.
- Reuse approval decision if exists; else fallback to `applyPolicy`.

## 4) Notifications
- File: `apps/gateway/src/approvals.notify.ts`
- `sendNotification(approval)` posts to webhook if configured.
- Trigger on approve/deny/expire.

## 5) Tests
- File: `apps/gateway/__tests__/retry_notify.test.ts`.
- Cases: pending, approve→allow, deny→403, expire→403, notify fired.

Keep Day 4 + Day 5 tests green.
