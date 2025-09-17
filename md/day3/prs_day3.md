# Day 3 Pull Request Checklist

Este documento define los PRs recomendados para implementar Day 3 en forma ordenada y atómica.  
La idea es que Cursor trabaje en **ramas separadas** y con instrucciones concretas, para reducir riesgos.

---

## 🔹 PR 1 — Tests
**Branch**: `feat/tests`  
**Título**: `test: add base unit/integration suites`  
**Descripción**:  
Implementa pruebas unitarias e integración mínimas en sanitizer, gateway, collector y core.  
Agrega carpeta `__tests__/` y tests e2e básicos con Playwright en web.  

**Checklist**:
- [ ] Crear `__tests__` en cada servicio.  
- [ ] Sanitizer: detecciones y scores.  
- [ ] Gateway: allow/deny + HMAC.  
- [ ] Collector: POST/GET events.  
- [ ] Core: helpers (HMAC, sanitize).  
- [ ] Web: e2e flujo básico sanitizer.  

---

## 🔹 PR 2 — Metrics
**Branch**: `feat/metrics`  
**Título**: `feat(metrics): add /metrics endpoints + UI p95`  
**Descripción**:  
Exponer métricas Prometheus en los servicios y conectar UI para mostrar p95 real.  

**Checklist**:
- [ ] Añadir `/metrics` en Collector, Sanitizer y Gateway.  
- [ ] Métricas http_requests_total y duración.  
- [ ] Métricas específicas: sanitizer_score, gateway_decisions.  
- [ ] UI: leer endpoints y mostrar p95 en dashboard.  
- [ ] Validar con `curl` local.  

---

## 🔹 PR 3 — Policies
**Branch**: `feat/policies`  
**Título**: `feat(policies): policy schema + enforcement + dry-run`  
**Descripción**:  
Implementar esquema YAML validado con Zod, versionado en DB y enforcement en Gateway.  

**Checklist**:
- [ ] Definir `packages/core/policy.ts` con validación.  
- [ ] Tablas `policies` y `policy_versions` en DB.  
- [ ] Endpoint publish policy.  
- [ ] Endpoint dry-run.  
- [ ] Enforcement en Gateway: allow/deny/pending.  
- [ ] Canary rollout 10%.  
- [ ] UI: conectar editor YAML con backend real.  

---

## 🔹 PR 4 — CI/CD
**Branch**: `chore/ci-cd`  
**Título**: `chore(ci): add GitHub Actions for tests + reports`  
**Descripción**:  
Configurar pipeline GitHub Actions para correr tests, métricas y e2e automáticamente.  

**Checklist**:
- [ ] Workflow Node 20.x con pnpm.  
- [ ] Jobs: build, unit tests, integration tests, e2e.  
- [ ] Reports: coverage, Playwright.  
- [ ] Validar que pipelines pasen con cambios de PRs previos.  

---

## 🚀 Instrucciones para Cursor
- Trabajar **un PR a la vez** en el orden: Tests → Metrics → Policies → CI/CD.  
- Usar siempre ramas separadas (`feat/tests`, `feat/metrics`, etc.).  
- Al terminar un cambio, abrir PR con título y checklist de este doc.  
- Validar que CI/CD pase antes de mergear.  
- Pedir cosas atómicas:  
  - Ejemplo: *“Implementa el endpoint /metrics en sanitizer con prom-client y actualiza tests”*.  
  - Evitar pedir varias features a la vez.  

---

## Definition of Done (Day 3)
- [ ] Todos los PRs mergeados en `master`.  
- [ ] Tests básicos corriendo.  
- [ ] Métricas reales en UI.  
- [ ] Policies funcionando (publish, dry-run, enforce, canary).  
- [ ] CI/CD ejecutando pipelines completos.
