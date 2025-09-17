# Day 3 Tests

## Estructura
```
apps/{collector,gateway,sanitizer}/__tests__/
apps/web/e2e/
packages/core/__tests__/
```

## Stack
- Vitest (unit/integration)
- Supertest (Fastify)
- Playwright (e2e)

## Casos mínimos
- Sanitizer: detecciones y scores.
- Gateway: allow/deny, HMAC.
- Collector: POST/GET events.
- Core: helpers HMAC y sanitización.

## Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

## Definition of Done
- ✅ Suites unitarias y e2e corren en CI.
- ✅ Gateway y Sanitizer cubiertos.
