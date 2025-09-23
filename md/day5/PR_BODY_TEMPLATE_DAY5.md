# Day 5 — Approvals (In-Memory) PR

## Summary
- In-memory approvals store
- Approval routes (list/get/approve/deny)
- Enforcement pending branch → create approval + 202
- TTL expiry cron

## Scope (Cage)
- apps/gateway/src
- apps/gateway/__tests__
- packages/core
- md/day5
- scripts

## Tests
- `vitest run apps/gateway/__tests__/approvals.test.ts`
- (optional) include Day 4 allowlist tests

## Checklist
- [ ] Store
- [ ] Routes
- [ ] Enforcement pending → 202
- [ ] TTL expiry
- [ ] Tests passing
- [ ] No files outside cage
