# Cage Day 9

## Límites
- Modificar solo:
  - apps/web/app/(dashboard)/approvals/*
  - apps/web/features/approvals/*
  - apps/web/__tests__/*
  - md/day9/*

## Restricciones
- No nuevas dependencias (solo shadcn/ui vía CLI).
- Mantener todos los tests previos verdes.
- Tests de Day 9 separados (uno por feature).
- Backend (gateway/collector) intocado.

## Reglas
- Usar shadcn/ui components.
- Incluir Toaster en layout si faltara.
- No duplicar lógica: reusar api.ts y types.ts.
