import { Hono } from "hono";
import { cors } from "hono/cors";
import { hmacSign } from "@toolgate/core";

type Env = { HMAC_KEY: string };

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());

let policy = { read_only: true, allow_domains: ["example.com", "api.example.com"] };

app.post("/v1/policies/publish", async (c) => {
  const body = await c.req.json().catch(()=> ({}));
  policy.read_only = body?.egress?.read_only ?? policy.read_only;
  policy.allow_domains = body?.egress?.allow_domains ?? policy.allow_domains;
  return c.json({ ok: true, policy });
});

app.post("/v1/egress", async (c) => {
  const { url, method = "GET", headers = {}, body = "", orgId, projectId, agentId, traceId } = await c.req.json();
  const u = new URL(url);

  const allowed = policy.allow_domains.some(d => u.hostname === d || u.hostname.endsWith(`.${d}`));
  if (!allowed) return c.json({ allowed:false, reason:"domain-not-allowed", host:u.hostname }, 403);

  if (policy.read_only && ["POST","PUT","PATCH","DELETE"].includes(String(method).toUpperCase()))
    return c.json({ allowed:false, reason:"read-only", method }, 403);

  const sig = await hmacSign(c.env.HMAC_KEY, `${method} ${url} ${body ?? ""}`);
  const outHeaders = new Headers(headers as any);
  outHeaders.set("x-toolgate-sig", sig);

  const resp = await fetch(url, { method, headers: outHeaders, body: ["GET","HEAD"].includes(method) ? undefined : body });
  const text = await resp.text();

  // (Opcional para debug local) incluye la firma generada:
  const debug = c.req.query("debug") === "1";

  return c.json({
    allowed: true, status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") },
    body: text.slice(0, 2000),
    meta: { orgId, projectId, agentId, traceId, ...(debug ? { sig } : {}) }
  });
});

export default app;