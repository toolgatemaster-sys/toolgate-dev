# PR2 — Metrics

## Branch
- Create branch: `feat/metrics`

## Scope
Add `/metrics` endpoint with Prometheus metrics (`prom-client`) to **Collector**, **Gateway** and **Sanitizer**.

## Allowed changes
- `apps/collector/src/**`
- `apps/gateway/src/**`
- `apps/sanitizer/src/**`
- If needed, add a new file `metrics.plugin.ts` inside each app (e.g. `apps/collector/src/metrics.plugin.ts`).
- Update each app's `src/server.ts` (or entrypoint) to register the metrics route.

## Forbidden changes
🚫 DO NOT modify:
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- any `tsconfig*.json`
- `.eslintrc*`, `.prettierrc*`, `.npmrc`, `.nvmrc`
- Playwright files (`playwright.*`, `e2e/**`, `tests/e2e/**`)
- `.github/**` (unless explicitly told)
- any dependencies (prom-client is already installed)

If you cannot complete the task without violating these rules, STOP and ask.

## Requirements
1. Each service must expose:
   - **Counter**: `http_requests_total` with labels (`service`, `method`, `status`).
   - **Histogram**: `http_request_duration_seconds` with labels (`service`, `method`, `status`).
   - Optional: other counters (e.g. blocked writes, sanitizer signals).
2. Endpoint:
   - Path: `GET /metrics`
   - Content-Type: `text/plain; version=0.0.4`
   - Returns the registry metrics.
3. Naming:
   - All metrics must prefix with service name (`collector_`, `gateway_`, `sanitizer_`).
4. Tests:
   - Add simple Vitest test in `apps/**/__tests__/metrics.test.ts` that hits `/metrics` and asserts:
     - Status 200
     - Response contains `http_requests_total`
5. No mocks of prom-client: use the real registry with default metrics cleared in tests.

## Acceptance
- Running `pnpm test` passes all tests (new + old).
- Running each service locally (`pnpm dev`) exposes `/metrics` that returns valid Prometheus format.
- Commit message: `feat(metrics): add /metrics endpoint to collector, gateway, sanitizer`
