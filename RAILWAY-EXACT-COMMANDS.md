# Railway Configuration - Exact Commands

## 🚀 Configuración Exacta para Railway

### **Root Directory**: `/` (repo raíz para TODOS los servicios)

## **1. Web UI Service (toolgate-ui)**

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/web build
```

**Start Command:**
```bash
pnpm --filter @toolgate/web start
```

## **2. Gateway Service**

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/gateway build
```

**Start Command:**
```bash
pnpm --filter @toolgate/gateway start
```

## **3. Collector Service**

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/collector build
```

**Start Command:**
```bash
pnpm --filter @toolgate/collector start
```

## **4. Sanitizer Service**

**Build Command:**
```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/sanitizer build
```

**Start Command:**
```bash
pnpm --filter @toolgate/sanitizer start
```

## 🔧 Variables de Entorno

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Gateway
HMAC_KEY=your_secret_key_here
ALLOW_HOSTS=internal.local,httpbin.org

# Service URLs (Railway genera automáticamente)
TOOLGATE_COLLECTOR_URL=https://toolgate-collector.up.railway.app
TOOLGATE_PROXY_URL=https://toolgate-gateway.up.railway.app
TOOLGATE_SANITIZER_URL=https://toolgate-sanitizer.up.railway.app

# Optional
USE_REDIS=false
NODE_ENV=production
```

## 📋 Verificaciones

✅ **apps/web/package.json tiene:**
- `"name": "@toolgate/web"`
- `"start": "next start -p $PORT"`

✅ **Root package.json tiene:**
- `"packageManager": "pnpm@9.0.0"`
- `"workspaces": ["apps/*", "packages/*"]`

✅ **Archivos en repo raíz:**
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`

¡Copia y pega exactamente estos comandos en Railway! 🚀
