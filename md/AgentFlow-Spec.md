# Agent Flow — Spec (MVP)

## Qué muestra
- Nodos: Input → Sanitizer → Policy → Gate (HMAC) → (Approval?) → Tool → Internal API → Output
- Heatmap de riesgo: color por score/violaciones; “blocked/approved” como badges.
- Métricas por nodo: uso, latencia, errores/bloqueos, dominios.
- Overlay de políticas: regla aplicada (read-only/allowlist/HMAC).
- Diff de versiones (futuro): comparar v1.x vs v1.y.

## Datos requeridos por nodo
- sanitizer: score, signals, p95 (agg).
- policy: decision, reason.
- gate: latency, status, allowed.
- approval: status (pending/approved/denied).
- tool: tool/target/action.
- internal: status/latency.
- output: resumen.

## API
- Tiempo real (trace): GET /api/trace-graph/:id → nodes/edges.
- Agregado (ventana): GET /v1/graph?agentId=&from=&to=.

## Privacidad
- Mostrar solo host (no path) y redactar PII por defecto.
- Modo debug opt-in con expiración y roles.
