# Cursor Prompts — Toolgate

## 1) Gateway (Fastify + HMAC + allowlist + proxy)
Create a Fastify service in TypeScript with POST /v1/proxy accepting { method, url, headers, body, traceId }. Validate host belongs to ALLOW_HOSTS, if write method require approval check (stub), sign an HMAC-SHA256 over {method,url,traceId,ts} using HMAC_KEY and forward with undici. Return upstream status/body, emit an event to /v1/events with decision and latency.

## 2) Sanitizer (regex + score + spotlight)
Fastify POST /v1/sanitize-context with options { stripHtml, defang, spotlight, text }. Return { clean, spotlighted, score, signals[] }. Add regex detectors: “ignore previous”, “developer mode”, hidden HTML/CSS, suspicious links.

## 3) Collector (Postgres + Zod)
Fastify POST /v1/events storing {traceId,type,ts,attrs,orgId,projectId,agentId,eventId,parentEventId,tool,target,action,latencyMs,status,decision,riskScore} in Postgres; GET /v1/traces/:id returns ordered events. Include zod validation and simple rate limit.

## 4) Agent Flow (beta)
Next.js route GET /api/trace-graph/:id that transforms /v1/traces/:id into React Flow nodes/edges (heatmap by riskScore, labels by decision).

## 5) Approvals (MVP)
Implement POST /v1/approvals and POST /v1/approvals/:id/approve or /deny storing in Postgres; UI Inbox lists pending approvals and lets you change status.
