# Context — Day 4

## Status at end of Day 3
- **PR1 — Tests**: base flow and helpers ready.
- **PR2 — Metrics**: `prom-client` in Collector, Gateway, Sanitizer; `/metrics` + tests.
- **PR3 — Policies**: core schema/parser/evaluate (manual validation), Collector in-memory store with versioning (`/publish`, `/dry-run`, `/active`, `/versions`, `/activate/:id`), Gateway wired with preHandler applying policy. 39 tests passing.

## Day 4 Goals
1) **Allowlist Enforcement (Gateway)** — decisions from policy become **hard** (`allow`/`deny`), optional `pending` → approvals queue.
2) **Fix legacy tests** that referenced `@toolgate/core`: repoint to `packages/core` helpers.
3) **Docs/Prompts** for Cursor with cages (jaulas) para evitar cambios fuera de scope.

## Constraints
- ❌ No dependencies nuevas, ❌ no cambios de config (package.json, lockfiles, tsconfig, linters, .github).
- ✅ Vitest + Supertest only.
- ✅ NodeNext import style consistente (si ya usan `.js` en imports locales TS, mantenerlo).
