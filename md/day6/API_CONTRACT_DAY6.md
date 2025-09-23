# Day 6 — API Contract (Retry + Notifications)

## Retry / Idempotency
- Enforcement determines `bodyHash` for every request.
- Decision reuse table:
  - `approved` → allow (200).
  - `denied` → deny (403).
  - `expired` → deny (403).
  - `pending` → 202 with same `approval_id`.

## Notifications (Webhook)
- Env var: `TOOLGATE_WEBHOOK_URL`.
- Trigger on approve/deny/expire.
- POST JSON body:
```json
{
  "id": "apr_xxx",
  "status": "approved",
  "agentId": "agent123",
  "ctx": { "tool": "http.post", "domain": "api.example.com", "method": "POST", "path": "/v1/tools/http.post", "bodyHash": "..." },
  "ts": 1730000000000
}
