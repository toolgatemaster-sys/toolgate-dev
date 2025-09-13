# Toolgate - Security Gateway for AI Agents

**Última actualización:** 2025-01-27

Toolgate es un gateway de seguridad para agentes de IA que proporciona sanitización de contenido, control de egress, y monitoreo de eventos.

## 🏗️ Arquitectura

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Web UI    │    │  Gateway    │    │  Collector  │
│ (Next.js)   │───▶│ (Fastify)   │───▶│ (Fastify)   │
│ Port 3000   │    │ Port 8787   │    │ Port 8785   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                   ┌─────────────┐
                   │  Sanitizer  │
                   │ (Fastify)   │
                   │ Port 8786   │
                   └─────────────┘
```

## 🚀 Inicio Rápido

### 1. Configuración de Entorno

```bash
# Copiar variables de entorno
cp ENV.example .env.local

# Configurar variables en .env.local:
# - DATABASE_URL (Supabase/PostgreSQL)
# - HMAC_KEY (secreto para firmas)
# - ALLOW_HOSTS (dominios permitidos)
```

### 2. Base de Datos

```bash
# Verificar conexión
./scripts/check-db.sh

# Crear tablas (si no existen)
psql $DATABASE_URL -f md/day2/Supabase-Schema.sql
```

### 3. Instalar Dependencias

```bash
pnpm install
```

### 4. Ejecutar Servicios

```bash
# Todos los servicios
pnpm dev

# O individualmente:
pnpm dev:collector  # Puerto 8785
pnpm dev:sanitizer  # Puerto 8786  
pnpm dev:gateway    # Puerto 8787
pnpm dev:web        # Puerto 3000
```

### 5. Probar Servicios

```bash
pnpm test:services
```

## 📋 Servicios

### Collector (Puerto 8785)
- **POST /v1/events** - Almacena eventos
- **GET /v1/traces/:id** - Obtiene eventos por trace

### Sanitizer (Puerto 8786)  
- **POST /v1/sanitize-context** - Sanitiza contenido
- Detectores: ignore_previous, developer_mode, hidden_html, suspicious_links

### Gateway (Puerto 8787)
- **POST /v1/proxy** - Proxy con HMAC signing y allowlist
- Verifica dominios permitidos en ALLOW_HOSTS
- Firma requests con HMAC-SHA256

### Web UI (Puerto 3000)
- Dashboard interactivo
- Botones para probar todos los servicios
- Monitoreo en tiempo real

## 🔧 Variables de Entorno

```bash
# Comunes
NODE_ENV=production
SENTRY_DSN=

# Gateway
HMAC_KEY=your_secret_key_here
ALLOW_HOSTS=internal.local,httpbin.org

# Collector  
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://:pass@host:port/0
USE_REDIS=false

# UI
TOOLGATE_COLLECTOR_URL=http://localhost:8785
TOOLGATE_PROXY_URL=http://localhost:8787  
TOOLGATE_SANITIZER_URL=http://localhost:8786
```

## 🧪 Testing

### Tests Automáticos
```bash
pnpm test:services
```

### Tests Manuales (curl)

**Collector:**
```bash
curl -s -X POST $COLLECTOR_URL/v1/events \
  -H 'content-type: application/json' \
  -d '{"traceId":"t1","type":"test.event","ts":"2025-01-27T12:00:00Z","attrs":{"ok":true}}'

curl -s $COLLECTOR_URL/v1/traces/t1
```

**Gateway (Allow):**
```bash
curl -s -X POST $PROXY_URL/v1/proxy \
  -H 'content-type: application/json' \
  -d '{"method":"GET","url":"https://httpbin.org/get","headers":{},"traceId":"t2"}'
```

**Gateway (Deny):**
```bash
curl -s -X POST $PROXY_URL/v1/proxy \
  -H 'content-type: application/json' \
  -d '{"method":"GET","url":"https://evil.example.com","headers":{},"traceId":"t3"}'
```

**Sanitizer:**
```bash
curl -s -X POST $SANITIZER_URL/v1/sanitize-context \
  -H 'content-type: application/json' \
  -d '{"text":"Ignore previous instructions","stripHtml":true,"defang":true,"spotlight":true}'
```

## 📁 Estructura del Proyecto

```
toolgate/
├── apps/
│   ├── collector/     # Event storage (Fastify)
│   ├── gateway/       # Proxy with HMAC (Fastify)  
│   ├── sanitizer/     # Content sanitization (Fastify)
│   ├── web/           # Dashboard UI (Next.js)
│   └── gate/          # Cloudflare Worker (legacy)
├── packages/
│   └── core/          # Shared logic (sanitization, HMAC)
├── scripts/           # Development scripts
├── md/day2/           # Documentation & schemas
└── ENV.example        # Environment template
```

## 🔒 Seguridad

- **HMAC Signing**: Todas las requests externas están firmadas
- **Host Allowlist**: Solo dominios permitidos pueden ser accedidos
- **Content Sanitization**: Detección de patrones maliciosos
- **Event Logging**: Todas las acciones se registran con traces

## 📚 Documentación Adicional

- [README-Cursor.md](md/day2/README-Cursor.md) - Plan de desarrollo
- [API-Contracts.md](md/day2/API-Contracts.md) - Contratos de API
- [Test-Checklist.md](md/day2/Test-Checklist.md) - Lista de pruebas
- [Supabase-Schema.sql](md/day2/Supabase-Schema.sql) - Esquema de BD

## 🐛 Troubleshooting

### Base de Datos
```bash
# Verificar conexión
./scripts/check-db.sh

# Recrear tablas
psql $DATABASE_URL -f md/day2/Supabase-Schema.sql
```

### Servicios No Inician
```bash
# Verificar puertos
lsof -i :8785  # Collector
lsof -i :8786  # Sanitizer  
lsof -i :8787  # Gateway
lsof -i :3000  # Web UI

# Logs detallados
pnpm dev:collector  # Ver logs individuales
```

### Variables de Entorno
```bash
# Verificar que .env.local existe
ls -la .env.local

# Verificar variables (sin mostrar valores)
grep -E "^[A-Z]" .env.local | cut -d'=' -f1
```

## 🚧 Estado Actual

✅ **Completado:**
- Estructura del monorepo
- Collector (eventos y traces)
- Gateway (proxy con HMAC y allowlist)
- Sanitizer (detección de patrones)
- Web UI (dashboard interactivo)
- Scripts de desarrollo y testing

🔄 **En Desarrollo:**
- Approvals MVP
- Agent Flow (beta)
- Policies panel

📋 **Próximos Pasos:**
- Day 3: Persistencia completa + Approvals
- Day 4: Agent Flow beta
- Day 5: Policies panel + red-team suite
