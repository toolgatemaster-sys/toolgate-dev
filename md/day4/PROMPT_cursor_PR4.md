# Cursor Instructions — PR4 (Allowlist)

Read ONLY: md/day4/PR4_allowlist.md

HARD RULES
- Branch: feat/allowlist
- Touch ONLY: 
  - apps/gateway/src/** apps/gateway/__tests__/**
  - packages/core/**  (helpers/imports only; tiny evaluate refinements allowed if strictly needed)
  - apps/collector/src/** (only if minor adjustment to GET /v1/policies/active is required)
  - md/day4/**
- Do NOT modify or stage: package.json, pnpm-lock.yaml, pnpm-workspace.yaml, any tsconfig*.json, ESLint/Prettier configs, Playwright, .github/**
- Do NOT install/remove dependencies
- Tests: Vitest + Supertest only

TASKS
1) Create apps/gateway/src/policy.enforce.ts with registerEnforcement(app) and register it in server.ts.
   - Build ctx { profile, tool, url } from request
   - Infer action (read|write)
   - Call applyPolicy(ctx, action)
   - Map decisions: allow → next; deny → 403; (optional) pending → 202

2) Tests
   - Create apps/gateway/__tests__/allowlist.test.ts with ALLOW/DENY/READ-ONLY cases.
   - Update apps/collector/__tests__/collector.flow.test.ts imports from @toolgate/core to packages/core.

3) Helpers
   - Ensure packages/core/__tests__/helpers/hmac.ts exists (sign helper).
   - (Optional) packages/core/__tests__/helpers/env.ts with TEST_CLIENT_HMAC.

ACCEPTANCE
- New allowlist tests pass locally.
- Collector flow test compiles/runs with corrected imports.
- No config/lockfile/deps changes.
