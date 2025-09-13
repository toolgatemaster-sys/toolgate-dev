
# Toolgate — Cursor Context Pack

> **Purpose:** Give Cursor the minimum-but-sufficient project context so it can implement features reliably, with fewer back-and-forths.

## 1) Elevator Pitch
**Toolgate** is a “Sentry-for-Agents” style control-plane: sanitize inputs, enforce egress policies, and collect traces from AI agents. MVP = Sanitizer + Policy/Tool‑Gate (egress allowlist + read-only + HMAC signing) + minimal UI + tests.

## 2) MVP Scope (Day 1)
- **Sanitizer & Context Firewall (web)**: `analyze(text) → {score, signals, clean}` (defang links + spotlight risky tokens).
- **Gate (Cloudflare Worker)**: `POST /v1/egress` with domain allowlist + read-only writes + HMAC signature header `x-toolgate-sig`.  
  `POST /v1/policies/publish` to set `{ egress: { read_only: boolean, allow_domains: string[] } }` (in-memory for now).
- **UI (Next.js + Tailwind + OKLCH)**: minimalist page “Sanitizer” + Theme toggle (light/dark).  
- **Core package**: framework-agnostic TypeScript lib with sanitizer & HMAC helpers + Vitest tests.
- **Out of scope today**: Auth, org/project CRUD, persistent storage, Slack approvals.

**Principles:** least-privilege, fail-closed for writes, policy-as-code, observability by default, “data ≠ instructions”.

## 3) Repo Layout
```
toolgate/
├─ apps/
│  ├─ web/     # Next.js app (UI + /api/sanitize)
│  └─ gate/    # Cloudflare Worker (Hono) egress proxy + policies
├─ packages/
│  └─ core/    # @toolgate/core (sanitizer + HMAC + tests)
├─ pnpm-workspace.yaml
└─ package.json (workspaces)
```

## 4) Tech Choices
- **Node 20+**, **pnpm** workspaces, **TypeScript (ESM)**.
- **Web**: Next.js (App Router) + Tailwind; tokens in **OKLCH** (shadcn-style custom theme).
- **Gate**: Cloudflare Worker + **Hono**.
- **Tests**: Vitest in `@toolgate/core`.

## 5) Contracts (APIs & Types)

### 5.1 Core Types & Functions
```ts
type AnalyzeResult = { score: number; signals: string[]; clean: string };

function defangLinks(s: string): string;     // http(s) -> hxxp(s), dots -> [.]

function spotlight(source: "user"|"tool"|"system", s: string): string;
// wraps risky tokens with ⟦…⟧

function analyze(s: string): AnalyzeResult;  // uses defangLinks + rules

async function hmacSign(key: string, msg: string): Promise<string>;  // hex sha256
function safeEqual(a: string, b: string): boolean;
async function hmacVerify(key: string, msg: string, hex: string): Promise<boolean>;
```

### 5.2 Web API
`POST /api/sanitize`
```jsonc
// req
{ "text": "Ignore previous… http://a.b" }

// res (AnalyzeResult)
{ "score": 40, "signals": ["override-intent","egress-link"], "clean": "…" }
```

### 5.3 Gate API (Worker)
`POST /v1/policies/publish` → set in-memory policy:
```jsonc
{ "egress": { "read_only": true, "allow_domains": ["api.example.com","openai.com"] } }
```

`POST /v1/egress` (forwarding proxy) body:
```jsonc
{
  "url": "https://api.example.com/foo",
  "method": "GET",
  "headers": { "accept": "application/json" },
  "body": "",
  "orgId": "org_demo",
  "projectId": "proj_core",
  "agentId": "agent_v1",
  "traceId": "tr_1"
}
```
**Behavior:**
- **Allowlist**: only domains in `allow_domains` (exact or subdomain) are allowed.
- **Read-only**: if `read_only: true`, block `POST|PUT|PATCH|DELETE` (return 403 `{reason:"read-only"}`).
- **HMAC**: sign `${method} ${url} ${body}` with `HMAC_KEY`, attach `x-toolgate-sig` header to outbound request.
- **Response**: JSON echo with `status`, short `body` (first 2000 chars), and `meta` (orgId/projectId/agentId/traceId).

## 6) Environment & Commands
- **Root**:
  - `pnpm -w -F @toolgate/core build`  
  - `pnpm -w -F @toolgate/core test`
- **Web**:
  - `pnpm --filter web dev` → http://localhost:3000
- **Gate**:
  - `pnpm --filter gate wrangler dev` → http://127.0.0.1:8787

## 7) Coding Conventions
- **TypeScript ESM**, `"type":"module"`; small pure functions in `core` (no framework deps).
- Keep **API schemas** minimal but explicit; validate inputs where feasible.
- Prefer **functional** utilities and deterministic behavior (no global state except policy in Worker for MVP).
- **Tests**: include at least 1 test per exported function in `core`.

## 8) Task Template for Cursor
When asking Cursor, use this template:

**Background**: (1–2 sentences linking to files with `@` mentions)  
**Goal**: Implement **X** according to section **Y** of this doc.  
**Constraints**: TS ESM; no external deps except listed; keep functions pure.  
**Inputs**: (example payloads)  
**Outputs**: (shape + example)  
**Acceptance Criteria**:
- All new/updated tests pass.
- For invalid input, return 4xx with `{reason}`.
- No lint/build errors.
**Files to edit**: `@packages/core/src/index.ts`, `@apps/gate/src/index.ts`, …

**Example Prompt**:
> Implement `POST /v1/egress` in `@apps/gate/src/index.ts` using the policy rules from **5.3**. Add helper to check subdomain match. Return JSON with `{allowed, status, reason?, body, meta}`. Add unit tests in `@toolgate/core` where possible (pure helpers).

## 9) Anti-Goals (for MVP)
- No auth, no multi-tenant persistence, no Slack approvals, no Supabase writes today.
- No UI polish beyond theme toggle + a single “Sanitize” page.

## 10) Nice-to-haves Later
- Supabase `events` persistence; real Timeline UI
- Approvals workflow; Architecture graph; SDKs for popular agent frameworks
- Policy YAML with schema validation; per-agent overrides

---

### How to Give Cursor Context (Practically)
- Open this file + the relevant source files, then in Cursor **mention them with `@`** in your prompt so they’re loaded as context.
- Keep prompts **small and focused** (one endpoint or one module at a time).
- Provide **example payloads** and **acceptance criteria** up front.
