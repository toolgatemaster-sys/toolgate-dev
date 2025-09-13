# Toolgate — Day 2 Setup (actualizado)

**Fecha:** 2025-09-06

Este documento describe el sprint de implementación para el **Día 2**.  
Día 1 quedó validado (Gate + Sanitize básicos funcionando). Día 2 avanza hacia enforcement real y collector mínimo.

---

## 🎯 Objetivos Día 2

1. Enforcement HMAC en API interna (fail-closed).  
2. Collector mínimo (`/v1/events`).  
3. Gate endurecido (subdominios, razones de bloqueo).  
4. Web API proxy (`/api/event`) para UI.  
5. Checklist de aceptación con `curl`.  

---

## 🛠 Cambios clave

- Internal API (Hono) exige `x-toolgate-sig`.  
- Gate firma con HMAC usando `method url traceId ts`.  
- Collector recibe eventos, guarda in-memory (→ Supabase en Day 3).  
- UI ya puede emitir eventos vía `/api/event`.  
- Helper `isAllowedHost` para validar subdominios.  

---

## ✅ Aceptación Day 2

- [x] API interna rechaza sin firma (403).  
- [x] La misma llamada vía Gate se permite (200).  
- [x] Collector recibe eventos (`ok:true`).  
- [x] Gate filtra hosts correctamente.  
- [x] UI emite eventos a Collector.  

---

## 📌 Próximos pasos Day 3

- Persistencia en Supabase (`events` table).  
- Breadcrumbs Sentry con traceId.  
- Endpoint `approvals` + Inbox mínima.  
- Iniciar Agent Flow (React Flow) en modo beta.  

---
