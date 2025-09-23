# Day 6 — Testing Template

# Cases
First request → 202 pending.
Approve → retry same bodyHash → 200.
Deny → retry same bodyHash → 403.
Expire → retry same bodyHash → 403.
Notification fired on approve/deny/expire.

```bash
vitest run apps/gateway/__tests__/retry_notify.test.ts


