# Day 4 — Testing Template

## Run only Day 4 focus
```bash
vitest run   apps/gateway/__tests__/allowlist.test.ts   apps/collector/__tests__/collector.flow.test.ts
```

## Wider subset (optional)
```bash
vitest run   apps/gateway/__tests__/allowlist.test.ts   apps/collector/__tests__/collector.flow.test.ts   apps/*/__tests__/metrics.test.ts   packages/core/__tests__/policy.schema.test.ts   packages/core/__tests__/policy.evaluate.test.ts
```
