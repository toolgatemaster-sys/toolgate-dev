# Comandos Finales para Railway - Day 2

## ✅ Configuración Verificada y Funcionando

La configuración actual del proyecto está correcta:

- ✅ `packages/core/package.json` - Paquete válido con build script
- ✅ `apps/web/package.json` - Dependencia `@toolgate/core: workspace:^` 
- ✅ `apps/web/next.config.mjs` - `transpilePackages: ['@toolgate/core']`
- ✅ Build de `@toolgate/core` funciona correctamente
- ✅ Build de `apps/web` funciona correctamente
- ✅ Build de `apps/gateway` funciona correctamente
- ✅ Build de `apps/sanitizer` funciona correctamente
- ✅ Build de `apps/collector` funciona correctamente
- ✅ Errores de TypeScript corregidos
- ✅ Imports corregidos para usar rutas relativas a `@toolgate/core`

## Comandos para Railway

### 1. Web UI Service (toolgate-ui)
**Root Directory:** `/` (raíz del repo)

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/core build && pnpm --filter @toolgate/web build
```

**Start Command:**
```bash
pnpm --filter @toolgate/web start
```

### 2. Gateway Service (toolgate-gateway)
**Root Directory:** `/` (raíz del repo)

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/core build && pnpm --filter @toolgate/gateway build
```

**Start Command:**
```bash
pnpm --filter @toolgate/gateway start
```

### 3. Collector Service (toolgate-collector)
**Root Directory:** `/` (raíz del repo)

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/core build && pnpm --filter @toolgate/collector build
```

**Start Command:**
```bash
pnpm --filter @toolgate/collector start
```

### 4. Sanitizer Service (toolgate-sanitizer)
**Root Directory:** `/` (raíz del repo)

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/core build && pnpm --filter @toolgate/sanitizer build
```

**Start Command:**
```bash
pnpm --filter @toolgate/sanitizer start
```

## Variables de Entorno Requeridas

Cada servicio necesita sus variables específicas:

### Comunes
- `NODE_ENV=production`

### Web UI
- `NEXT_PUBLIC_TOOLGATE_SANITIZER_URL`
- `NEXT_PUBLIC_TOOLGATE_PROXY_URL` 
- `NEXT_PUBLIC_TOOLGATE_COLLECTOR_URL`

### Gateway
- `HMAC_KEY`
- `ALLOW_HOSTS`
- `COLLECTOR_URL` (URL del collector service)

### Collector
- `DATABASE_URL`
- `REDIS_URL` (opcional)
- `USE_REDIS=false`

### Sanitizer
- No requiere variables adicionales

## Notas Importantes

1. **Root Directory:** Todos los servicios deben tener el root directory en `/` (raíz del repo) para que pnpm vea el `pnpm-workspace.yaml`

2. **Orden de Build:** Los comandos incluyen `pnpm --filter @toolgate/core build` primero para asegurar que el paquete core esté compilado antes que cualquier servicio que dependa de él

3. **Puertos:** Los servicios Fastify usan los puertos configurados en sus respectivos `package.json` (8785, 8786, 8787). Railway asignará automáticamente el puerto para la web UI

4. **Dependencias:** El build instala todas las dependencias del workspace (`pnpm -w install --frozen-lockfile`) antes de compilar los paquetes específicos

## Estado del Proyecto

- ✅ Monorepo configurado correctamente
- ✅ Todos los servicios implementados
- ✅ Builds funcionando localmente
- ✅ TypeScript sin errores
- ✅ Configuración lista para Railway

**¡Listo para deploy! 🚀**