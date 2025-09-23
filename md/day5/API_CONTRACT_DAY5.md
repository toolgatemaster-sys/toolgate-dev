# Day 5 — API Contract (Approvals)

## Create (implicit)
Created automatically inside the enforcement hook when policy returns `pending`.

Approval object:
```ts
type ApprovalStatus = "pending" | "approved" | "denied" | "expired";
type Approval = {
  id: string;            // apr_<rand>
  agentId?: string;
  createdAt: number;
  expiresAt: number;     // default TTL 3600s
  reason?: string;       // e.g. "policy"
  ctx: {
    tool?: string;
    domain?: string;
    method?: string;
    path?: string;
    bodyHash?: string;
  };
  status: ApprovalStatus;
  note?: string;
};
```

## GET `/api/approvals`
Query params (optional):
- `status`: `pending | approved | denied | expired`
- `agentId`: string

Response:
```json
{ "items": [Approval, ...] }
```

## GET `/api/approvals/:id`
Response:
- `200` → `Approval`
- `404` → `{ "error": "not_found" }`

## POST `/api/approvals/:id/approve`
Body (optional):
```json
{ "note": "approved via dashboard" }
```
Response:
- `200` → `{ "status": "approved" }`
- `404` → `{ "error": "not_found" }`

## POST `/api/approvals/:id/deny`
Body (optional):
```json
{ "note": "risk too high" }
```
Response:
- `200` → `{ "status": "denied" }`
- `404` → `{ "error": "not_found" }`

## Enforcement → pending response (Gateway)
When `applyPolicy(...)` returns `"pending"`:
```json
{
  "decision": "pending",
  "approval_id": "apr_xxx",
  "ttl_seconds": 3600
}
```
Status code: **202 Accepted**.
