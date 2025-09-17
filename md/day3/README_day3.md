# Day 3 README

## Orden de desarrollo y testing

Para evitar confusión en Cursor, seguimos un flujo atómico y paso a paso.  
Cada archivo de `md/day3/` define una parte del trabajo.

### 1. **Overview**
- Leer `day3_overview.md` para entender objetivos y Definition of Done.

### 2. **Tests**
- Implementar primero los tests (unitarios, integración, e2e).
- Seguir `day3_tests.md`.
- Correr `pnpm test` y validar CI.

### 3. **Metrics**
- Agregar endpoints `/metrics` en Collector, Sanitizer y Gateway.
- Seguir `day3_metrics.md`.
- Conectar la UI para mostrar p95 real.

### 4. **Policies**
- Implementar esquema YAML y validación con Zod.
- Agregar tablas `policies` y `policy_versions`.
- Seguir `day3_policies.md`.
- Gateway debe aplicar reglas (allow/deny/pending).
- Validar dry-run y canary.

### 5. **CI/CD**
- Configurar GitHub Actions para correr todo automáticamente.
- Seguir `day3_ci_cd.md`.
- Validar reports y coverage.

---

## Reglas para Cursor
- Pedir tareas atómicas (ejemplo: *“Implementa el test unitario de sanitizer para detección de hidden_html”*).  
- Revisar outputs de Cursor antes de hacer commit.  
- Mantener un PR por feature: `feat(metrics)`, `feat(policies)`, `test: add suites`.  

---

## Definition of Done (Day 3)
- ✅ Tests unitarios, integración y e2e corriendo en CI.  
- ✅ /metrics expuesto con Prometheus y UI mostrando p95 real.  
- ✅ Policies en DB y aplicadas en Gateway con dry-run y canary.  
- ✅ CI/CD automatizado con reports.

