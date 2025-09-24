
---

### `md/day7/IMPLEMENTATION_GUIDE.md`
```markdown
# Day 7 — Implementation Guide (Next.js App Router + shadcn/ui)

**Objetivo:** construir la primera UI de Approvals usando **shadcn/ui**, consumiendo el backend existente.  
**Alcance:** solo frontend. **No** agregar nuevas dependencias.  
**Cage Day 7:** `apps/web/app`, `apps/web/features`, `apps/web/__tests__`, `md/day7`, `scripts`.

---

## Estructura de archivos (Next.js App Router)

- **Página (route Next):**
  - `apps/web/app/(dashboard)/approvals/page.tsx`
- **Componente principal (UI):**
  - `apps/web/app/(dashboard)/approvals/ApprovalsTab.tsx`
- **Helpers & tipos:**
  - `apps/web/features/approvals/api.ts`
  - `apps/web/features/approvals/types.ts`
- **Tests (UI):**
  - `apps/web/__tests__/approvals.ui.test.tsx`

---

## 1) Crear la página Next (App Router)

Archivo: `apps/web/app/(dashboard)/approvals/page.tsx`

```tsx
import ApprovalsTab from "./ApprovalsTab";

export default function ApprovalsPage() {
  return <ApprovalsTab />;
}
