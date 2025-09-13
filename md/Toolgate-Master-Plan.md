# Toolgate — Master Plan

**Fecha de última actualización:** 2025-09-06

---

## 1. Introducción

**Visión**  
Toolgate — *Clean inputs. Controlled outputs. Every tool call, signed.*

**Problema**  
Las aplicaciones basadas en agentes/LLMs enfrentan riesgos críticos: prompt injection, output inseguro, tool-calls no controladas. Hoy no existe una solución que combine observabilidad + enforcement en runtime.

**Solución**  
Toolgate provee:
- Sanitizer de contexto (strip/defang/spotlight).
- Gate con políticas, allowlist, HMAC signatures y approvals humanos.
- Collector centralizado con timeline/auditoría.
- UI para monitoreo, approvals e insights.

---

## 2. Arquitectura MVP

**Servicios (Railway):**
- `gateway`: proxy de egress con enforcement (allowlist, HMAC).
- `sanitizer`: limpia y marca inputs sospechosos.
- `collector`: recibe y persiste eventos.
- `ui`: Next.js + shadcn para interacción.

**Infra mínima:**
- Railway: 4 servicios (gateway, sanitizer, collector, ui).
- Supabase: Postgres (`events`, `approvals`).
- Redis: rate limiting y cuotas por tenant.
- Sentry: métricas, latencias, errores.

**Endpoints clave:**
- `POST /v1/sanitize-context`
- `POST /v1/proxy`
- `POST /v1/events`
- `GET  /v1/traces/:id`

---

## 3. Contrato de eventos

Campos principales:
```ts
eventId: uuid
parentEventId?: uuid
orgId?: string
projectId?: string
agentId?: string
traceId: string
type: string            // sanitize.result, gate.decision, tool.start, etc.
tool?: string           // http, db, fs, openai, ...
target?: string         // dominio/host o recurso lógico
action?: string         // GET, POST, SELECT, etc.
riskScore?: number      // 0–100
decision?: string       // allow, deny, degrade, approved, pending
latencyMs?: number
status?: number
attrs?: Record<string,any>
ts: ISO string
```

---

## 4. Roadmap

### **Fase 1 — MVP (2-3 semanas)**
- Sanitizer (regex, score, spotlight).
- Gate (HMAC, allowlist, read-only).
- Collector básico (persistencia Supabase).
- UI mínima (Sanitize, Proxy, Timeline).

### **Fase 2 — Observabilidad enriquecida (3-6 semanas)**
- Timeline con métricas (latencia, blocked, riesgo).
- Agent Flow por traceId (React Flow).
- Approvals UX (Inbox + Slack integration).
- Redacción/privacidad (dominios, no PII).

### **Fase 3 — Gobierno & Escala (2-3 meses)**
- Policy-as-code madura (OPA/Rego, dry-run, canary).
- Multi-tenant + RBAC.
- Integraciones (LangChain, LlamaIndex, SIEM, Slack).
- SLOs/SLA (p95 < 80ms, HA, multi-región).

### **Fase 4 — Advanced**
- Grafo agregado (últimas 24h/semana por agente).
- Diff de versiones (v1.2 vs v1.3).
- Adapters profundos (Assistants, frameworks).
- Red-team automation (datasets PI/IPI).

---

## 5. UI / UX

- **Timeline** → eventos ordenados con filtros.
- **Approvals Inbox** → aprobar/denegar tool-calls (con caducidad).
- **Agent Flow** → DAG en tiempo real con heatmap de riesgo y políticas overlay.
- **Policies Panel** → editor YAML con dry-run/canary/versionado.
- **Dashboard** → métricas de latencia, riesgo, bloqueos, aprobaciones.

---

## 6. Operativa de equipo

- **Kanban** (To do / Doing / Review / Done).
- **Checkpoint diario** (15 min por chat).
- **Checklist de entregables por sprint** (aceptación con curl).
- **Semáforo de estado**: On track / At risk / Blocked.

---

## 7. Próximos hitos (Semana actual)

- Persistencia real en Supabase (`events`).
- Approvals endpoint + inbox mínima.
- UI Timeline conectada a Collector.
- Test suite con payloads de red-team comunes.

---

