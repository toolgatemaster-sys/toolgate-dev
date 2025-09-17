# Day 3 Overview

## Objetivo
Consolidar **tests, métricas y policies** para Toolgate.

## Servicios involucrados
- Collector (8785)
- Sanitizer (8786)
- Gateway (8787)
- Web UI (3000)

## Alcance
- Pruebas unitarias, integración y e2e básicas.
- Exposición de métricas Prometheus y conexión con UI.
- Policies: YAML → validación → enforcement real.

## Definition of Done
- ✅ Tests corren en CI/CD.
- ✅ Métricas expuestas y UI muestra p95 real.
- ✅ Policies versionadas y aplicadas en Gateway.
