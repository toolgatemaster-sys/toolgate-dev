# Day 5 — Testing Template

## Focus
```bash
vitest run apps/gateway/__tests__/approvals.test.ts
```

## Optional combined
```bash
vitest run apps/gateway/__tests__/allowlist.test.ts apps/gateway/__tests__/approvals.test.ts
```

## Cases to cover
1) `pending` → **202** + `approval_id`
2) `approve` → status becomes `approved`
3) `deny` → status becomes `denied`
4) `expireOld()` marks old pending as `expired`
5) `GET /api/approvals?status=pending` filters

> Do **not** modify tests outside the cage.
