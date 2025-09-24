You are Cursor working on **Day 7 of Toolgate**. Build the **UI Approvals — Phase 1** using **shadcn/ui** only.

**Constraints**
- Cage: only modify/create `apps/web/app`, `apps/web/features`, `apps/web/__tests__`, `md/day7`, `scripts`.
- No new dependencies.
- Use shadcn/ui components for UI (Table, Button, Badge, Card, Input, Select, Tabs, Switch, Toast).

**References**
- Contract: `md/day7/API_CONTRACT_DAY7.md`
- Implementation plan: `md/day7/IMPLEMENTATION_GUIDE.md`
- Testing: `md/day7/TESTING_TEMPLATE_DAY7.md`

**Steps**
1) Create `ApprovalsTab.tsx` with shadcn/ui in `apps/web/app/(dashboard)/approvals/`.
2) Create Next.js route: `apps/web/app/(dashboard)/approvals/page.tsx` → export `<ApprovalsTab />`.
3) Create `api.ts` and `types.ts` under `apps/web/features/approvals/`.
4) Write tests in `apps/web/__tests__/approvals.ui.test.tsx`.
5) Do **not** change backend or add deps.
6) Run tests and ensure green.
7) Prepare PR using `md/day7/PR_BODY_TEMPLATE_DAY7.md`.
