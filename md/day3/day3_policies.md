# Day 3 Policies

## YAML Schema
```yaml
version: 1
profiles:
  researcher:
    read_only: true
    tools: [http.get, vector.search]
    domains_allow: [api.example.com]
    budgets:
      rpm: 60
defaults:
  approvals_ttl_seconds: 3600
```

## Validación
- `packages/core/policy.ts` con Zod.
- Guardar en DB (`policies`, `policy_versions`).

## Enforcement
- Gateway aplica allow/deny/pending.
- Dry-run endpoint: evalúa acción.

## Canary
- 10% de requests a versión candidata.
- Métricas etiquetadas.

## Definition of Done
- ✅ Policies versionadas en DB.
- ✅ Gateway aplica reglas.
- ✅ Dry-run operativo.
