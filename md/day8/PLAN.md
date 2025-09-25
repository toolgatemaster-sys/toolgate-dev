
# Day 8 — UI Approvals (Phase 2)
## Objetivos
- Agregar Drawer de detalle con metadata del approval.
- Permitir añadir "note" al aprobar/denegar.
- Soportar selección múltiple en tabla (bulk approve/deny iterado).
- Mejorar UX visual con shadcn/ui (sin tocar backend).

## Criterios de aceptación
- Drawer abre desde una fila y muestra: id, agentId, status, tool, domain, method, created, expires, reason, note (textarea).
- Botones Approve/Deny en Drawer y en cada fila; ambos pasan opcionalmente "note".
- Selección múltiple con checkboxes + acciones bulk que iteran sobre los ids seleccionados.
- Sin 500/404 si el backend no corre: lista vacía y UI estable.
- Tests de Day 7 permanecen verdes; se agregan tests nuevos para Drawer/note.

## Alcance
- Solo frontend en apps/web (Next.js App Router + shadcn/ui).
- Sin nuevas rutas backend; bulk = iterativo en cliente.

## No-hacer
- No tocar Day 1–6 backend.
- No agregar dependencias fuera de las que instala shadcn/ui.
MD

cat > md/day8/CAGE.md <<'MD'
# Cage Day 8 — Límites de cambios

## Permitido
- apps/web/app/(dashboard)/approvals/*
- apps/web/features/approvals/*
- apps/web/components/ui/*      (generado por shadcn CLI)
- apps/web/hooks/*              (toast si se necesita)
- md/day8/*
- scripts/* (solo shadcn-day8.sh / no romper pnpm-dev.sh)

## Prohibido
- apps/gateway/**, apps/collector/**, packages/core/** (backend)
- Cambiar stack fuera de Next/Tailwind/shadcn/ui
- Añadir servicios/infra (Railway, Supabase) en Day 8
MD
