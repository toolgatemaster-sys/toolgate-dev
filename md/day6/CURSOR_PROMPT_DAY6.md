You are Cursor working on **Day 6 of Toolgate**. Implement Retry/Idempotency via `bodyHash` and Notifications for approval state changes.

**Constraints**
- Cage: only touch `apps/gateway/src`, `apps/gateway/__tests__`, `packages/core`, `md/day6`, `scripts`.
- No new dependencies.
- Keep Day 4 + Day 5 behavior and tests green.

**References**
- API contract: `md/day6/API_CONTRACT_DAY6.md`
- Implementation plan: `md/day6/IMPLEMENTATION_GUIDE.md`
- Testing: `md/day6/TESTING_TEMPLATE_DAY6.md`

**Steps**
1. `packages/core/approval.ts`: add `hashBody(body: unknown): string`.
2. `apps/gateway/src/approvals.store.ts`: include `bodyHash` in `ctx`; add index + `findByBodyHash(hash)`.
3. `apps/gateway/src/enforcement.ts`: compute `bodyHash`; if approval exists reuse decision (approved=200, denied/expired=403, pending=202 + same `approval_id`). Else fallback to `applyPolicy`.
4. `apps/gateway/src/approvals.notify.ts`: implement `sendNotification(approval)`; POST to `TOOLGATE_WEBHOOK_URL` if set.
5. `apps/gateway/__tests__/retry_notify.test.ts`: add tests per template.
6. Run tests and ensure green.
7. Prepare PR with `md/day6/PR_BODY_TEMPLATE_DAY6.md`.

Do not modify files outside the cage.
Do not add new dependencies.
