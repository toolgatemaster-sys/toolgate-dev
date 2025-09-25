# ===== PR Day 8: UI Approvals (Drawer, notes, bulk) =====
set -euo pipefail

# 0) Asegúrate de estar en la rama de Day 8 (cámbiala si tu rama tiene otro nombre)
git checkout day8/ui-approvals-drawer

# 1) PR body (auto) — genera un archivo temporal con el contenido del PR
cat > /tmp/PR_DAY8_BODY.md <<'MD'
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
- [ ] CI `web-tests` en verde
- [ ] Solo cambios dentro del cage
- [ ] Sin nuevas deps fuera de shadcn CLI y UI local
- [ ] Squash & merge
MD

# 2) Asegúrate de que todo esté añadido/commiteado (ajusta el mensaje si falta algo)
git add md/day8 apps/web
git commit -m "feat(web): Day 8 — approvals drawer, notes, bulk (shadcn ui)" || true
git push -u origin HEAD

# 3) Crear PR → master (si tienes gh)
if command -v gh >/dev/null 2>&1; then
  gh pr create \
    --base master \
    --head "$(git branch --show-current)" \
    --title "feat(web): Day 8 — approvals drawer, notes, bulk (shadcn ui)" \
    --body-file /tmp/PR_DAY8_BODY.md \
    --label "ui" --label "day8"

  # 4) Auto-merge con squash cuando pase CI
  gh pr merge --squash --auto
else
  echo "ℹ️ No se encontró 'gh'. Abre el PR desde GitHub: rama actual → master, usando /tmp/PR_DAY8_BODY.md como descripción."
fi

echo "✅ PR Day 8 creado (auto-merge activado si 'gh' está disponible)."
