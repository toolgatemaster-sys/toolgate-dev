# Day 3 – Plan de Avance Toolgate

## Objetivos principales
- ✅ Mantener Collector, Gateway y Sanitizer funcionando (baseline estable).
- 🚀 Avanzar en:
  - Tests automáticos (smoke, integración, contract).
  - Métricas y logging unificado.
  - Policies base (auth, seguridad, rate limiting).

## 1. Tests
- [ ] Definir estructura de test (Vitest / Jest).
- [ ] Smoke tests para `/healthz` en cada servicio.
- [ ] Tests de proxy en Gateway → Collector.
- [ ] Validaciones de schema en Sanitizer.

## 2. Métricas
- [ ] Evaluar Fastify plugins para Prometheus / OpenTelemetry.
- [ ] Definir endpoints `/metrics` opcionales.
- [ ] Planificar dashboard inicial (Grafana / Railway logs).

## 3. Policies
- [ ] Incorporar HMAC signing en Gateway → Collector.
- [ ] Configurar variable `ADMIN_TOKEN` más robusta.
- [ ] Diseñar un YAML base para policies (`Policies-Base.yaml`).

## 4. Próximos pasos
- Crear `Day4-Plan.md` con foco en UI + Dashboard.
- Preparar documentación de despliegue estable (Railway + GitHub Actions).
