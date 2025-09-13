# Toolgate — API Contracts

**Última actualización:** 2025-09-06

## 1) Sanitizer
**POST** `/v1/sanitize-context`
```json
{ "stripHtml": true, "defang": true, "spotlight": true, "text": "..." }
```
**200**:
```json
{ "clean":"...", "spotlighted":"...", "score": 0-100, "signals": ["ignore_previous","hidden_html"] }
```

## 2) Proxy (Gate)
**POST** `/v1/proxy`
```json
{ "method":"POST","url":"http://internal.local/v1/storage/put","headers":{"content-type":"application/json"},"body":"...","orgId":"...","projectId":"...","agentId":"...","traceId":"..." }
```
**200**:
```json
{ "allowed":true, "status":200, "body":"...", "meta":{"latency":12,"ts":"...","sig":"<hex>"} }
```
**403**:
```json
{ "allowed":false, "reason":"domain-not-allowed" }
```

## 3) Events (Collector)
**POST** `/v1/events`
```json
{ "eventId":"uuid","parentEventId":"uuid","traceId":"t1","type":"gate.decision","tool":"http","target":"internal.local","action":"POST","latencyMs":12,"status":200,"decision":"allow","riskScore":40,"attrs":{},"orgId":"...","projectId":"...","agentId":"...","ts":"ISO" }
```
**200**: `{ "ok": true, "eventId": "uuid" }`

**GET** `/v1/traces/:id`
**200**:
```json
{ "traceId":"t1","events":[{"eventId":"...","type":"...","ts":"...","attrs":{}}] }
```

## 4) Approvals (MVP)
**POST** `/v1/approvals`
```json
{ "traceId":"t1","reason":"write to storage","action":{"url":"...","method":"POST","body":"..."},"requester":"user@org" }
```
**200**: `{ "id":"uuid","status":"pending" }`

**POST** `/v1/approvals/:id/approve`
**POST** `/v1/approvals/:id/deny`
**200**: `{ "id":"uuid","status":"approved|denied" }`

## 5) Graphs
**GET** `/v1/graph?agentId=&from=&to=`
**200**:
```json
{ "ok":true, "nodes":[{"id":"n1","type":"http","label":"http • internal.local • POST","stats":{"uses":10,"avgLatency":21,"blockedOrErrors":1,"avgRisk":43}}], "edges":[{"id":"e1","from":"http::start","to":"http::internal.local","count":10,"avgLatency":22,"blocked":1}] }
```

**GET** `/api/trace-graph/:id`
**200**:
```json
{ "nodes":[{"id":"gate","data":{"allowed":true},"position":{"x":200,"y":120}}], "edges":[{"id":"e3","source":"policy","target":"gate","label":"allow"}] }
```
