# Day 6 — Retry & Notifications PR

## Summary
- bodyHash-based retry.
- Reuse decisions across retries.
- Notifications on state changes.
- All tests green.

## Scope (Cage)
- apps/gateway/src
- apps/gateway/__tests__
- packages/core
- md/day6
- scripts

## Tests
```bash
vitest run apps/gateway/__tests__/retry_notify.test.ts
