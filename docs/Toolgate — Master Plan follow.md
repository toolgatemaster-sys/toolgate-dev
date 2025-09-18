# Toolgate — Master Plan

## MVP Status (end of Day 3)

### Backend
- ✅ **Day 1 – Tests**
  - Flow tests Collector ↔ Gateway con firma HMAC.
  - Helpers centralizados en `packages/core/__tests__/helpers`.
  - 33 tests pasando en PR1.

- ✅ **Day 2 – Metrics**
  - `prom-client` en Collector, Gateway y Sanitizer.
  - Endpoints `/metrics` en cada servicio (format Prometheus).
  - KPIs: `*_http_requests_total`, `*_http_request_duration_seconds`.
  - 9 tests pasando (3 por servicio).

- ✅ **Day 3 – Policies**
  - Core (`packages/core`):
    - `policy.schema.ts`, `policy.parser.ts`, `policy.evaluate.ts`.
    - Validación manual sin dependencias nuevas.
  - Collector:
    - In-memory store versionado.
    - Endpoints: `/v1/policies/publish`, `/v1/policies/dry-run`, `/v1/policies/active`, `/v1/policies/versions`, `/v1/policies/activate/:id`.
  - Gateway:
    - Cliente de políticas con cache TTL.
    - Hook `preHandler` aplicando `applyPolicy`.
  - Tests: 39 en total (core + collector + gateway).
  - PR3 mergeado a `master`.

### UI (Proof of Concept)
- **UI v6 (shadcn)** — un solo archivo para visualizar estilo y estructura.
  - Tabs: Overview, Policies, Approvals, Traces, Settings.
  - KPIs conectados a mocks (Latency p95, Throughput, Blocked Writes).
  - Editor de políticas con YAML mockeado.
  - Approvals list y Traces con datos falsos.
- **Limitación**: es un **mock demo**, no la app real (no hay estructura de componentes, rutas, data-fetching ni tests de UI).
- Objetivo: servir de guía visual hacia la UI real en Next.js + shadcn.

---

## Next Steps (MVP Completion)

### Day 4 – Gateway Allowlist Enforcement
- Backend:
  - Enforce `allow` / `deny` (y opcional `pending`) en Gateway.
  - Fix imports de tests que referencian `@toolgate/core`.
- UI: no cambios (se mantiene PoC).

### Day 5 – Approvals Queue
- Backend:
  - Cola in-memory en Gateway con endpoints `GET/POST`.
- UI:
  - Conectar Approvals tab al backend (listar + aprobar/denegar).

### Day 6 – Budgets & Rate Limits
- Backend:
  - Enforcement de RPM por perfil.
- UI:
  - Mostrar uso de budgets en Metrics tab.

---

## Roadmap Beyond MVP
- Persistencia de políticas y approvals (DB).
- UI real (Next.js + shadcn):
  - Refactor del PoC en estructura de componentes y rutas.
  - Conexión real a `/metrics`, `/policies`, `/approvals`.
- Métricas más ricas (PromQL o parsing de histogramas).
- Auditoría, logs de seguridad, refinamiento de allowlist.
- Pipeline de despliegue: Railway/Vercel para servicios + UI.

---

## Deliverables por Day
- **PR1 – Tests**: branch `feat/tests`, 33 tests verdes.
- **PR2 – Metrics**: branch `feat/metrics`, endpoints + 9 tests.
- **PR3 – Policies**: branch `feat/policies`, endpoints + 39 tests.
- **PR4 – Allowlist**: branch `feat/allowlist`, enforcement en Gateway + fix tests.
- **PR5 – Approvals**: branch `feat/approvals`, cola mínima.
- **PR6 – Budgets**: branch `feat/budgets`, enforcement de rate limit.

---

_Last updated: 2025-09-17_
