# Toolgate Dev

Este repositorio contiene el **MVP de Toolgate**, una plataforma para:
- **Sanitizer** → limpiar y analizar contenido sospechoso.
- **Collector** → almacenar y consultar trazas/eventos.
- **Gateway** → proxy con sanitización opcional y firma HMAC.
- **Web UI** → dashboard compacto para visualizar y administrar.

## Estructura
- `/docs/TOOLGATE-MASTER.md` → contexto completo, plan de MVP, variables, comandos de test y roadmap.
- `/apps/web/components/ToolgateApp.jsx` → interfaz compacta en React (Next.js + shadcn + Tailwind + framer-motion).

## Estado Actual
- ✅ Sanitizer estable (`/v1/sanitize-context`)
- ✅ Collector conectado a Postgres
- ✅ Gateway con fallback y firma HMAC
- ✅ UI compacta inicial
- 🚧 Falta: smoke tests integrados, métricas básicas, policies dinámicas

## Comandos útiles
```bash
# Build
pnpm -w install --frozen-lockfile
pnpm --filter @toolgate/core build
pnpm --filter @toolgate/sanitizer build
pnpm --filter @toolgate/collector build
pnpm --filter @toolgate/gateway build

# Start servicios
pnpm --filter @toolgate/sanitizer start
pnpm --filter @toolgate/collector start
pnpm --filter @toolgate/gateway start
pnpm --filter @toolgate/web dev
```

## Variables de Entorno
Ver detalle en `docs/TOOLGATE-MASTER.md`.
