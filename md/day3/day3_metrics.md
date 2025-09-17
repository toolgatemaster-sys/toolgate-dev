# Day 3 Metrics

## Endpoints
- `/metrics` en Collector, Gateway, Sanitizer.

## Métricas
- http_requests_total
- http_request_duration_seconds_bucket
- sanitizer_score_bucket
- gateway_decisions_total
- collector_events_total

## UI
- Calcular p95 desde histogramas.
- Reemplazar valor mock del dashboard.

## Validación
```bash
curl -s http://localhost:8786/metrics | head
```

## Definition of Done
- ✅ /metrics responde con prom-client.
- ✅ UI muestra p95 real.
- ✅ Errores capturados en Sentry.
