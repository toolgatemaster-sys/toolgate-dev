# Railway Configuration - Toolgate Day 2

## 🚀 Configuración para 4 Servicios

### **1. Web UI Service**
- **Root Directory**: `/` (repo raíz)
- **Build Command**: 
  ```bash
  corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/web build
  ```
- **Start Command**: 
  ```bash
  pnpm --filter @toolgate/web start
  ```
- **Variables**: `PORT` (Railway automático)

### **2. Collector Service**
- **Root Directory**: `/` (repo raíz)
- **Build Command**: 
  ```bash
  corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/collector build
  ```
- **Start Command**: 
  ```bash
  pnpm --filter @toolgate/collector start
  ```
- **Variables**: `DATABASE_URL`, `USE_REDIS=false`

### **3. Gateway Service**
- **Root Directory**: `/` (repo raíz)
- **Build Command**: 
  ```bash
  corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/gateway build
  ```
- **Start Command**: 
  ```bash
  pnpm --filter @toolgate/gateway start
  ```
- **Variables**: `HMAC_KEY`, `ALLOW_HOSTS`, `TOOLGATE_COLLECTOR_URL`

### **4. Sanitizer Service**
- **Root Directory**: `/` (repo raíz)
- **Build Command**: 
  ```bash
  corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm -w install --frozen-lockfile && pnpm --filter @toolgate/sanitizer build
  ```
- **Start Command**: 
  ```bash
  pnpm --filter @toolgate/sanitizer start
  ```
- **Variables**: Ninguna adicional

## 🔧 Variables de Entorno Comunes

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

✅ **Archivos en repo raíz:**
- `pnpm-lock.yaml` ✓
- `pnpm-workspace.yaml` ✓
- `package.json` con `"packageManager": "pnpm@9.0.0"` ✓
- `nixpacks.toml` ✓

✅ **Scripts correctos:**
- Fastify services: `"build": "tsc"`, `"start": "node dist/index.js"`
- Next.js web: `"build": "next build"`, `"start": "next start -p $PORT"`

✅ **Nombres de paquetes:**
- `@toolgate/web` ✓
- `@toolgate/collector` ✓
- `@toolgate/gateway` ✓
- `@toolgate/sanitizer` ✓

## 🎯 Resultado Esperado

Después del deploy, los servicios estarán disponibles en:
- **Web UI**: `https://toolgate-web.up.railway.app`
- **Collector**: `https://toolgate-collector.up.railway.app`
- **Gateway**: `https://toolgate-gateway.up.railway.app`
- **Sanitizer**: `https://toolgate-sanitizer.up.railway.app`

¡Listo para los smoke tests! 🚀
