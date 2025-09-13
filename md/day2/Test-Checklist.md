# Toolgate — Test Checklist (curl)

## Gate allowlist
- [ ] GET permitido (domain allow): 200
- [ ] GET bloqueado (domain no allow): 403

## Read-only enforcement
- [ ] POST → 403 con read_only=true
- [ ] POST → 200 con read_only=false y firma válida

## HMAC enforcement
- [ ] Internal API directo (sin x-toolgate-sig) → 403
- [ ] Via Gate (con firma) → 200

## Collector
- [ ] POST /v1/events → { ok:true }
- [ ] GET /v1/traces/:id → lista eventos ordenados

## Sanitizer
- [ ] Payload “ignore previous…” → score ≥ 60 y signal `ignore_previous`
- [ ] HTML oculto → signal `hidden_html`
- [ ] URL sospechosa → signal `suspicious_links`

## Approvals (MVP)
- [ ] POST /v1/approvals → pending
- [ ] Approve/Deny → status correcto
