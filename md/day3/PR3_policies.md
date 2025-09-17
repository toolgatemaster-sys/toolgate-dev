# PR3 — Policies (Day 3)

## Branch
`feat/policies`

## Scope
Minimal policies with in-memory versioning and endpoints:
- POST /v1/policies/publish
- POST /v1/policies/dry-run
- GET  /v1/policies/active

Gateway (Day 3): only wire-up (fetch active policy, applyPolicy).

## HARD RULES
- Work on branch: feat/policies
- Do NOT modify package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig*.json, eslint/prettier, playwright, .github/**
- Do NOT install/remove dependencies
- Touch ONLY: packages/core/**, apps/collector/src/** + __tests__, apps/gateway/src/** + __tests__, md/day3/**
- Tests: Vitest + Supertest
- Keep NodeNext import style consistent (.js extensions if already used)

... (rest of full spec omitted for brevity here)
