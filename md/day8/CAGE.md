# Cage Day 8 — Límites de cambios

## Permitido
- md/day8/*                      # docs de planificación y estado
- apps/web/app/(dashboard)/approvals/*   # UI (ApprovalsTab, ApprovalsDrawer)
- apps/web/features/approvals/*          # api.ts y types.ts (extensiones)
- apps/web/__tests__/*                  # nuevos tests (drawer, note, bulk)
- apps/web/components/ui/*              # solo agregar componentes via shadcn CLI
- scripts/pnpm-dev.sh                   # wrapper ya existente (sin romperlo)

## Prohibido
- apps/gateway/**, apps/collector/**, packages/core/**   # backend no se toca
- Configuración de infra (Railway, Supabase, Redis)
- Cambiar stack (Next.js, Tailwind, shadcn/ui ya están definidos)
- Reinstalar o re-init shadcn (solo se pueden **add** componentes)
