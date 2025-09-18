# PR4 — Allowlist Enforcement & Test Fixes

## What
- Enforce active policy in Gateway (allow/deny, optional pending).
- Fix legacy tests to import helpers from packages/core.
- Tests for allowlist behavior.

## Why
- Convert Day 3 policy into effective runtime control at the gateway boundary.
- Stabilize tests; remove @toolgate/core references.

## How
- preHandler `registerEnforcement` → builds ctx, infers action, calls applyPolicy, maps decisions.
- Updated imports in tests to packages/core helpers.

## Tests
- apps/gateway/__tests__/allowlist.test.ts (allow/deny/read-only)
- apps/collector/__tests__/collector.flow.test.ts (imports fixed)

## Next steps
- Day 5: approvals queue + UI, persistence, budgets.
