# Toolgate — README for Cursor

**Última actualización:** 2025-09-06

Este README guía a Cursor (o cualquier dev) en el orden correcto para levantar y probar Toolgate.  
El objetivo es **minimizar el riesgo de confusión** y asegurar reproducibilidad.

---

## 1. Configuración de entorno
1. Copiar `.env.local` de ejemplo:  
   ```bash
   cp ENV.example .env.local
   ```
2. Revisar valores: `HMAC_KEY`, `ALLOW_HOSTS`, `DATABASE_URL`, `REDIS_URL`, `SENTRY_DSN`.

Archivo: [ENV.example](ENV.example)

---

## 2. Base de datos (Supabase / Postgres)
1. Ejecutar el schema SQL para crear tablas `events` y `approvals`:  
   ```bash
   psql $DATABASE_URL -f Supabase-Schema.sql
   ```

Archivo: [Supabase-Schema.sql](Supabase-Schema.sql)

---

## 3. Policies base
1. Usar `Policies-Base.yaml` como default.  
2. Cambios deben ir vía PR → `dry-run → canary → 100%`.

Archivo: [Policies-Base.yaml](Policies-Base.yaml)

---

## 4. Servicios principales
Implementar en este orden (usar [Cursor-Prompts.md](Cursor-Prompts.md)):

1. **Sanitizer** → `/v1/sanitize-context`  
2. **Gateway** → `/v1/proxy` (HMAC + allowlist)  
3. **Collector** → `/v1/events` + `/v1/traces/:id`  
4. **Approvals (MVP)** → `/v1/approvals` (crear + approve/deny)  
5. **Agent Flow (beta)** → `/api/trace-graph/:id`

Archivo: [Cursor-Prompts.md](Cursor-Prompts.md)

---

## 5. UI / Next.js
- Conectar botones a `/api/sanitize`, `/api/proxy`, `/api/traces/:id`.  
- Wire para Inbox de Approvals.  
- Agregar vista `AgentFlow` en `/flows/:traceId`.

Referencia: [AgentFlow-Spec.md](AgentFlow-Spec.md)

---

## 6. Pruebas
Seguir [Test-Checklist.md](Test-Checklist.md).  
Ejemplo (HMAC fail-closed):  
```bash
# direct → 403
curl -i -s -X POST http://127.0.0.1:8788/v1/storage/put -d '{"secret":"x"}'

# via gate → 200
curl -s -X POST http://127.0.0.1:8787/v1/proxy -d '{"url":"http://internal.local/v1/storage/put","method":"POST","body":"{\"secret\":\"x\"}","traceId":"tr1"}'
```

Archivo: [Test-Checklist.md](Test-Checklist.md)

---

## 7. Plan de trabajo (esta semana)
Usar [Week-Plan.md](Week-Plan.md) para hitos diarios:

- Day 3 → Persistencia Supabase + Approvals básicos.  
- Day 4 → Agent Flow (beta).  
- Day 5 → Policies panel + red-team suite.

---

## 8. Contratos de API
Referencia siempre [API-Contracts.md](API-Contracts.md) para payloads y respuestas esperadas.

---

## Resumen del orden crítico
1. **ENV** → 2. **DB Schema** → 3. **Policies** → 4. **Services (con Cursor Prompts)** → 5. **UI** → 6. **Tests**.

Este orden **debe respetarse** para evitar bloqueos y asegurar reproducibilidad.

---
