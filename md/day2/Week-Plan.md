# Toolgate — Week Plan (Sprint)

**Última actualización:** 2025-09-06

## Cadencia
- Daily checkpoint (15 min por chat).
- Kanban: To do / Doing / Review / Done.
- Semáforo: On track / At risk / Blocked.

## Objetivo semanal
Demo e2e: sanitizer + gate (HMAC) + approvals + timeline.

---

## Day 3 — Persistencia & Approvals (Hoy)
- [ ] Collector → Supabase (tabla `events`).
- [ ] Endpoint `GET /v1/traces/:id` desde DB.
- [ ] Endpoint `POST /v1/approvals` (crear) y `POST /v1/approvals/:id/approve` o `/deny`.
- [ ] UI: Timeline leyendo desde `/v1/traces/:id` y Approvals Inbox mínima.
- **Aceptación**: curl básico + ver items en UI.

## Day 4 — Agent Flow (beta)
- [ ] API `/api/trace-graph/:id` (nodos/edges desde eventos).
- [ ] UI `AgentFlow` (React Flow) render → heatmap por `riskScore`.
- [ ] Botón “Ver diagrama” en Timeline.
- **Aceptación**: trace real dibuja 6–8 nodos y edges correctos.

## Day 5 — Policies & Red-team
- [ ] Policies panel (YAML, read-only para MVP).
- [ ] Dry-run en CI sobre trazas recientes.
- [ ] Red-team suite (prompt/indirect injection comunes).
- **Aceptación**: CI marca FAIL si la policy permitiría un caso crítico.

---

## Riesgos
- Latencia DB en Railway → usar pool y simple caching.
- Falsos positivos → thresholds prudentes y overrides temporales.

## Notas
- Mantener contratos estables (ver `API-Contracts.md`).
- Documentar PRs de policy con “dry-run → canary → 100%”.
