# Railway Configuration - Simplified

## 🚀 Configuración Simplificada para 4 Servicios

### **Root Directory para TODOS los servicios: `/` (repo raíz)**

### **1. Web UI Service**
- **Build Command**: `pnpm --filter @toolgate/web build`
- **Start Command**: `pnpm --filter @toolgate/web start`

### **2. Collector Service**
- **Build Command**: `pnpm --filter @toolgate/collector build`
- **Start Command**: `pnpm --filter @toolgate/collector start`

### **3. Gateway Service**
- **Build Command**: `pnpm --filter @toolgate/gateway build`
- **Start Command**: `pnpm --filter @toolgate/gateway start`

### **4. Sanitizer Service**
- **Build Command**: `pnpm --filter @toolgate/sanitizer build`
- **Start Command**: `pnpm --filter @toolgate/sanitizer start`

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

## 📋 Archivos de Configuración

✅ **En repo raíz:**
- `nixpacks.toml` - Configura pnpm automáticamente
- `.nvmrc` - Especifica Node.js 18
- `package.json` con `packageManager: "pnpm@9.0.0"`
- `pnpm-lock.yaml` y `pnpm-workspace.yaml`

El archivo `nixpacks.toml` se encarga de:
1. Instalar Node.js 18
2. Habilitar corepack
3. Instalar pnpm 9.0.0
4. Ejecutar `pnpm install --frozen-lockfile`

¡Solo necesitas configurar los comandos de build y start simples! 🚀
