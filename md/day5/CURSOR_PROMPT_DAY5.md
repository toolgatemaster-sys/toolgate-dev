You are Cursor working on **Day 5 of Toolgate**. Implement Approvals (in-memory) and connect Gateway enforcement `pending` to create approvals.

Follow these constraints and files:
- Cage: only touch `apps/gateway/src`, `apps/gateway/__tests__`, `packages/core`, `md/day5`, `scripts`.
- API contract: see `md/day5/API_CONTRACT_DAY5.md`.
- Implementation plan: `md/day5/IMPLEMENTATION_GUIDE.md`.
- Testing: `md/day5/TESTING_TEMPLATE_DAY5.md`.

Steps:
1) Implement store in `apps/gateway/src/approvals.store.ts`.
2) Implement routes in `apps/gateway/src/approvals.routes.ts`.
3) Update `apps/gateway/src/enforcement.ts` pending branch to create approval & return 202.
4) Add `packages/core/approval.ts` helpers.
5) Add tests in `apps/gateway/__tests__/approvals.test.ts` per template.
6) Run tests and ensure green.
7) Prepare PR using `md/day5/PR_BODY_TEMPLATE_DAY5.md`.

Do not modify files outside the cage.
Do not add new dependencies.
Keep Day 4 allowlist behavior untouched.
