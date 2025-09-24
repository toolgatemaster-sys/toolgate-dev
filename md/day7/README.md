
---

### `md/day7/README.md`
```markdown
# Day 7 — README (UI Approvals — Phase 1)

Este día implementamos la **primera versión de la UI de Approvals** usando **shadcn/ui** en Next.js App Router.

---

## QA Checklist

### Render
- [ ] La ruta `/approvals` carga correctamente.
- [ ] Se muestran filtros (status select, agentId input).
- [ ] Botón **Refresh** visible.
- [ ] Tabla con cabeceras correctas.

### Funcionalidad
- [ ] Cambiar filtro `status` → GET con query correcta.
- [ ] Cambiar filtro `agentId` → GET con query correcta.
- [ ] Click **Approve** → POST /approve + toast + refetch.
- [ ] Click **Deny** → POST /deny + toast + refetch.

### Auto-refresh
- [ ] ON → re-fetch cada ~12s.
- [ ] OFF → no hay polling.

### Estados
- [ ] Vacío → “No approvals found”.
- [ ] Error de red → toast + mensaje visible.
- [ ] Botones deshabilitados si no corresponde.

---

## Tests
```bash
vitest run apps/web/__tests__/approvals.ui.test.tsx
