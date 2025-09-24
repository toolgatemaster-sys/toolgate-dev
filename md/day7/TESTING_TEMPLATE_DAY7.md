# Day 7 — Testing Template (UI)

Cases

Render: shows filters, buttons, and table headers.
Filters: change status/agentId → correct query.
Approve/Deny: call API, show toast, refetch.
Polling: autoRefresh ON → refetch after interval.

Run:
```bash
vitest run apps/web/__tests__/approvals.ui.test.tsx
