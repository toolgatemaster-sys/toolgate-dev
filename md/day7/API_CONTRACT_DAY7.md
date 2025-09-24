# Day 7 — API Contract (UI consumption)

Approve

POST /api/approvals/:id/approve
Response: { "status": "approved" }

Deny

POST /api/approvals/:id/deny
Response: { "status": "denied" }

## List approvals
GET `/api/approvals?status=<pending|approved|denied|expired>&agentId=<string>`

Response:
```json
{ "items": [{
  "id": "apr_xxx",
  "agentId": "agent123",
  "createdAt": 1730000000000,
  "expiresAt": 1730003600000,
  "reason": "policy",
  "ctx": { "tool": "http.post", "domain": "api.example.com", "method": "POST", "path": "/v1/tools/http.post" },
  "status": "pending",
  "note": "optional"
}] }
