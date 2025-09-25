## What
Day 8 — UI Approvals Phase 2:
- Drawer de detalle (Sheet) con metadata del approval.
- Nota opcional en Approve/Deny.
- Selección múltiple + acciones bulk (iterativo en cliente).
- Mejora visual con shadcn/ui (sin tocar backend).

## Files Touched (cage)
- `apps/web/app/(dashboard)/approvals/*` (ApprovalsTab + Drawer)
- `apps/web/features/approvals/api.ts` (nota, bulk, detalle, tolerante a 404)
- `apps/web/features/approvals/types.ts` (ctx opcional, expiresAt opcional)
- `apps/web/components/ui/*` (solo nuevos componentes via shadcn: sheet, textarea, separator, etc.)
- `apps/web/__tests__/*` (tests nuevos Drawer/notes/bulk)
- `md/day8/*` (plan/cage)

## Why
- Iteración sobre la UX de approvals: gestión individual en detalle y acciones sobre múltiple selección.
- Mantener UI funcional aun sin backend (mock togglable por env).

## How
- `getApprovals/getApproval/approve/deny` toleran 404 para no romper UI si gateway no corre.
- `approve(id, note?) / deny(id, note?)` aceptan nota.
- `approveMany/denyMany` ejecutan iterativamente en cliente (no añade rutas backend).
- Mantener textos/roles de Day 7 para compatibilidad con tests previos.

## Tests
- Day 7: se mantienen verdes.
- Day 8: + Drawer abre y carga detalle, approve/deny con note, bulk approve/deny.

## Env (dev)
- `NEXT_PUBLIC_TOOLGATE_MOCK=1` (opcional) para datos ficticios.
- `NEXT_PUBLIC_TOOLGATE_GATEWAY_URL` y `NEXT_PUBLIC_TOOLGATE_APPROVALS_PATH` si se conecta a gateway real.

## Checklist
- [x] CI `web-tests` en verde
- [x] Solo cambios dentro del cage
- [x] Sin nuevas deps fuera de shadcn CLI y UI local
- [ ] Squash & merge
