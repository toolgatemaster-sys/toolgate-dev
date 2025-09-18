# PR4 — Gateway Allowlist Enforcement & Test Fixes

## Branch
`feat/allowlist`

## Scope
1) **Gateway enforcement (hard)**:
   - `preHandler` (o middleware equivalente) aplica `applyPolicy(ctx, action)` para **todas** las rutas relevantes.
   - Mapea decisiones:
     - `"allow"` → continuar
     - `"deny"`  → 403 `{ decision: "deny", reason }`
     - `"pending"` (opcional Day 4) → 202 `{ decision: "pending" }` y (si implementas) encolar en una cola de aprobaciones in-memory.
2) **Fix tests** que referencian `@toolgate/core`:
   - Actualiza imports a `packages/core` (por ejemplo: `../../../packages/core/__tests__/helpers/hmac.js`).
   - Si no existe el helper, créalo en `packages/core/__tests__/helpers/` (ver sección Helpers).
3) **(Opcional) Approvals minimal**:
   - Endpoints en Gateway:
     - `GET /v1/approvals` lista pending
     - `POST /v1/approvals/:id/approve`
     - `POST /v1/approvals/:id/deny`

## Allowed files
- `apps/gateway/src/**`, `apps/gateway/__tests__/**`
- `packages/core/**` (solo para helpers e imports o afinamiento menor de evaluate)
- `apps/collector/src/**` (solo si hace falta exponer/ajustar `GET /v1/policies/active`)
- `md/day4/**`

## Forbidden
- ❌ `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- ❌ `tsconfig*.json`, linters, Playwright, `.github/**`
- ❌ Instalar o remover dependencias

## Implementation details

### A) Enforcement in Gateway
- Añade `policy.enforce.ts` con `registerEnforcement(app)` y úsalo desde `server.ts`.
- Construye `ctx` a partir del request:
  - `profile`: header `x-tg-profile` (default `"anonymous"`)
  - `tool`: de `req.body.tool` o inferido por ruta
  - `url`: de `req.body.url` si aplica (ej: `http.get`)
- `action`: inferir por método HTTP: `GET|HEAD`→`"read"`; `POST|PUT|PATCH|DELETE`→`"write"`; o si el tool es `"storage.put"`, entonces `"write"`.
- Llama `applyPolicy(ctx, action)`.
- Respuesta:
  - `"deny"` → `reply.code(403).send({ decision: "deny", reason })`
  - `"pending"` (opcional Day 4) → `reply.code(202).send({ decision: "pending" })`
  - `"allow"` → sigue el pipeline.

### B) Tests
Crea/actualiza:
- `apps/gateway/__tests__/allowlist.test.ts` (integration):
  - **ALLOW**: dominio en `domains_allow`
  - **DENY**: dominio no permitido
  - **READ-ONLY WRITE**: perfil con `read_only: true` intentando `POST` → `deny` (o `pending` si así lo define `evaluate`)
- `apps/collector/__tests__/collector.flow.test.ts`:
  - Solo **corrige imports**: reemplaza `@toolgate/core` por `../../../packages/core/...` (no cambies la lógica).
- Mantén los tests de metrics intactos.

### C) Helpers de tests
- `packages/core/__tests__/helpers/hmac.ts`:
  - Firma HMAC para header `x-toolgate-client-sig` con `sha256`.
- `packages/core/__tests__/helpers/env.ts` (opcional):
  - Exponer `TEST_CLIENT_HMAC="dev-client-key"` para reutilizar.

### D) Acceptance
- Tests de allowlist pasan localmente.
- Collector flow test compila y corre con imports corregidos.
- No hay cambios en configs/lockfiles/deps.
