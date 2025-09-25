## What
Day 9 — UI Approvals Phase 3:
- Metrics dashboard con contadores (pending/approved/denied).
- Drawer extendido con metadata completa (ctx, reason, note).
- Tests unitarios adicionales.

## Why
Mejorar la UX del reviewer: visión rápida de estado + detalle más rico.

## How
- getApprovals reutilizado con filtros.
- Cards con shadcn/ui para métricas.
- Drawer muestra ctx, reason, note.

## Tests
- test-metrics: renderiza contadores.
- test-drawer-detail: muestra metadata.
- Day 7–8 tests siguen verdes.

## Checklist
- [ ] CI verde
- [ ] Cage respetado
- [ ] Sin nuevas dependencias
- [ ] Merge squash
