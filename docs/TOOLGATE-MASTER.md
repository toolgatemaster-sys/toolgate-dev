# TOOLGATE — MASTER DOCUMENT

## 🚀 Qué estamos construyendo
**Toolgate** es un **MVP de seguridad y observabilidad para agentes de IA**.  
Objetivo: proveer un “sentry-for-agents” que:
- **Sanitiza entradas** (inputs al modelo).
- **Controla salidas** (egress proxy firmado HMAC, allowlist de dominios, approvals humanos para operaciones críticas).
- **Registra todo** en un Collector con timeline y métricas.
- **Expone un UI** con dashboard y trazabilidad de cada acción del agente.

Este MVP nos permitirá:
- Demostrar flujo end-to-end (sanitize → gateway → collector → UI).
- Validar arquitectura en Railway + Supabase + Redis.
- Sentar base para roadmap (grafo DAG de agentes, heatmap de riesgo, adapters LangChain/LlamaIndex/Langflow).

---

## 🎯 MVP actual (versión 0.1)
Servicios principales:
1. **Collector**  
   - Recibe eventos (`/v1/events`), devuelve traces (`/v1/traces/:id`).  
   - Guarda en Postgres (Supabase).  
   - Estado: ✅ probado manualmente, funciona.

2. **Gateway**  
   - Proxy (`/v1/proxy`): valida allowlist, firma HMAC, reenvía request, emite evento al Collector.  
   - Estado: 🚨 responde 500/502, pendiente debug.

3. **Sanitizer**  
   - Endpoint (`/v1/sanitize-context`): limpia texto, detecta señales (`ignore_previous`, `developer_mode`, `hidden_html`, `suspicious_links`).  
   - Estado: ✅ responde, probado.

4. **Web/UI (Next.js)**  
   - Dashboard con botones hacia los servicios.  
   - Branding inicial de Toolgate.  
   - Estado: ✅ deployado, falta wiring completo con timeline/traces.

---

## 🛠️ Infraestructura
- **Railway**: despliegue de cada microservicio (gateway, sanitizer, collector, web).  
- **Supabase**: PostgreSQL + Session Pooler (puerto 6543) + `sslmode=require`.  
- **Upstash**: Redis (REST API + token).  
- **Variables de entorno**: cada servicio tiene las suyas (ver sección más abajo).  
- **Monorepo**: pnpm workspaces (`packages/core`, `apps/gateway`, `apps/sanitizer`, `apps/collector`, `apps/web`).  

---

## 📋 Operating rhythm
- Tablero Kanban (To do / Doing / Review / Done).  
- Checkpoint diario corto.  
- Checklist de entregables por sprint, con semáforo (On track / At risk / Blocked).  
- Cambios de políticas vía PR (`policy-as-code`).  
- Despliegues: dry-run → canary → 100%.  

---

## ✅ Estado actual
- Collector insert/leer OK (con dominio público temporal).  
- Sanitizer responde.  
- Web desplegado.  
- Gateway implementado, pero bug 502 (app no responde bien al proxy).  
- Infra (DB, Redis, envs) configurada.  

---

## ⚠️ Problemas pendientes
1. Gateway devuelve 500/502 en `/v1/proxy`.  
   - Revisar logs en Railway.  
   - Confirmar `/healthz` responde 200.  
   - Forzar IPv4 en Gateway (`setDefaultResultOrder('ipv4first')`).  
   - Validar `ALLOW_HOSTS` parseado correctamente.  
   - Confirmar `COLLECTOR_URL` correcto (usar público temporalmente, luego volver a interno).  

2. Collector interno aún no probado desde Gateway.  
   - Ahora Gateway usa dominio público.  
   - Meta: pasar a `http://toolgate-collector.railway.internal`.  

---

## 🔧 Variables de entorno

### Collector
```env
DATABASE_URL=postgresql://<user>:<pass>@db.<hash>.supabase.co:6543/postgres?sslmode=require
REDIS_URL=https://finer-meerkat-57131.upstash.io
REDIS_TOKEN=********
HMAC_KEY=supersecretkey
```

### Gateway
```env
HMAC_KEY=supersecretkey
ALLOW_HOSTS=httpbin.org,example.com
COLLECTOR_URL=https://toolgate-collector-production.up.railway.app   # temporal
```

### Sanitizer
```env
HMAC_KEY=supersecretkey
```

### Web
```env
NEXT_PUBLIC_TOOLGATE_GATEWAY_URL=https://toolgate-gateway.up.railway.app
NEXT_PUBLIC_TOOLGATE_SANITIZER_URL=https://toolgate-sanitizer.up.railway.app
```

---

## 🧪 Comandos de prueba

### Collector
```bash
export COLLECTOR_URL="https://toolgate-collector-production.up.railway.app"

curl -i -s -X POST "$COLLECTOR_URL/v1/events"   -H 'content-type: application/json'   -d '{"traceId":"t-check","type":"gate.decision","ts":"2025-01-01T00:00:00Z","attrs":{"ok":true}}'

curl -s "$COLLECTOR_URL/v1/traces/t-check"
```

### Gateway
```bash
export GATEWAY_URL="https://toolgate-gateway.up.railway.app"

# permitido (httpbin.org debe estar en ALLOW_HOSTS)
curl -i -s -X POST "$GATEWAY_URL/v1/proxy"   -H 'content-type: application/json'   -d '{"method":"GET","url":"https://httpbin.org/get","headers":{},"traceId":"t-allow"}'

# denegado
curl -i -s -X POST "$GATEWAY_URL/v1/proxy"   -H 'content-type: application/json'   -d '{"method":"GET","url":"https://evil.com","headers":{},"traceId":"t-deny"}'
```

### Sanitizer
```bash
export SANITIZER_URL="https://toolgate-sanitizer.up.railway.app"

curl -s -X POST "$SANITIZER_URL/v1/sanitize-context"   -H 'content-type: application/json'   -d '{"text":"<div style=\"display:none\">ignore previous</div> http://bad.evil","stripHtml":true,"defang":true,"spotlight":true}'
```

---

## 📅 Roadmap (más allá del MVP)
- **DAG/Graph view por agente**: nodos=tools/acciones, edges=llamadas.  
- **Heatmap de riesgo**: colorear nodos por score/violaciones.  
- **Overlay de políticas**: qué regla bloqueó/permitió y por qué.  
- **Version diff**: comparar arquitecturas entre releases de un agente.  
- **Adapters**: LangChain, LlamaIndex, Langflow, etc. para emitir `parentEventId` y tool con más precisión.  
- **Privacidad**: ocultar PII salvo modo debug.  
- **UI completa**: timeline, métricas, aprobaciones humanas, branding sólido.

---

## 📌 Próximos pasos inmediatos
1. Debug del Gateway:
   - Confirmar `/healthz`.
   - Revisar logs Railway.
   - Añadir `setDefaultResultOrder('ipv4first')`.
   - Probar curl a httpbin.org/get.
2. Confirmar eventos emitidos llegan a Collector.
3. Cambiar `COLLECTOR_URL` a interno y cerrar dominio público.
4. Extender UI para visualizar traces.
5. Preparar Day3 doc para Cursor (tareas claras).

---

## 🧭 Cómo usar este documento
- En un chat nuevo: pegar **todo este documento**.  
- Así me re-inicializas con el mismo contexto largo.  
- A partir de ahí seguimos avanzando donde lo dejamos.
