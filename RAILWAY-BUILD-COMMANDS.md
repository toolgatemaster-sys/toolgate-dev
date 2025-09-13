# Railway Build Commands - Final Solution

## 🚀 Comandos de Build que Instalan pnpm Primero

### **Root Directory**: `/` (para todos los servicios)

### **1. Web UI Service**
**Build Command:**
```bash
./install-pnpm.sh && pnpm install --frozen-lockfile && pnpm --filter @toolgate/web build
```

**Start Command:**
```bash
pnpm --filter @toolgate/web start
```

### **2. Collector Service**
**Build Command:**
```bash
./install-pnpm.sh && pnpm install --frozen-lockfile && pnpm --filter @toolgate/collector build
```

**Start Command:**
```bash
pnpm --filter @toolgate/collector start
```

### **3. Gateway Service**
**Build Command:**
```bash
./install-pnpm.sh && pnpm install --frozen-lockfile && pnpm --filter @toolgate/gateway build
```

**Start Command:**
```bash
pnpm --filter @toolgate/gateway start
```

### **4. Sanitizer Service**
**Build Command:**
```bash
./install-pnpm.sh && pnpm install --frozen-lockfile && pnpm --filter @toolgate/sanitizer build
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

## 📋 Lo que hace `install-pnpm.sh`:

1. ✅ Habilita corepack
2. ✅ Instala pnpm 9.0.0
3. ✅ Verifica la instalación
4. ✅ Ejecuta `pnpm install --frozen-lockfile`
5. ✅ Ejecuta el build específico del servicio

¡Esta solución debería funcionar definitivamente! 🚀
