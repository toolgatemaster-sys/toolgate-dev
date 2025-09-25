# Day 9 — Plan

## Objetivo
- Añadir un **Metrics Dashboard** en ApprovalsTab (cards con contadores).
- Enriquecer Drawer con metadata extendida.
- Tests unitarios por cada nueva feature.

## Features
1. Metrics
   - Cards con shadcn/ui: Pending, Approved, Denied.
   - Datos obtenidos de `getApprovals` con filtros.
2. Drawer detail
   - Mostrar ctx completo: tool, domain, method, path.
   - Mostrar reason y note (si existe).
3. Tests
   - test-metrics: asegura que los contadores se renderizan.
   - test-drawer-detail: asegura que la metadata aparece.

## Cage
- Sin cambios backend.
- UI + tests únicamente.
- Compatibilidad con Day 7–8.

## Cambios de código
- ApprovalsTab.tsx: Agregar sección superior con 3 cards (Pending, Approved, Denied). Debajo mantener filtros + tabla.
- ApprovalsDrawer.tsx: Mostrar ctx.tool, ctx.domain, ctx.method, ctx.path. Mostrar reason y note.