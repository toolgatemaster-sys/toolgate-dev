import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import Fastify from "fastify";
import cors from "@fastify/cors";
import { createHmac } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

// ESM Node18 → fetch global OK. Timeout manual con AbortController.
function withTimeout(ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms).unref();
  return { signal: c.signal, cancel: () => clearTimeout(t) };
}

function signHmac(key: string | undefined, payload: string) {
  if (!key || key.length < 8) return null; // fallback: sin firma si no hay clave
  return createHmac("sha256", key).update(payload).digest("hex");
}

function hostFrom(url: string) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ""; }
}

async function emitEvent(traceId: string, body: any) {
  try {
    const url = `${process.env.COLLECTOR_URL}/v1/events`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        traceId,
        type: "gate.decision",
        ts: new Date().toISOString(),
        attrs: body,
      }),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.error("[gateway] emitEvent failed", r.status, txt);
    }
  } catch (e: any) {
    console.error("[gateway] emitEvent error", e?.message || e);
  }
}

const app = Fastify({ logger: true });

// Error handler global
app.setErrorHandler((err, req, reply) => {
  req.log.error({ err }, "unhandled error");
  if (!reply.sent) reply.code(500).send({ error: "internal_error" });
});

await app.register(cors, { origin: true });

app.post("/v1/proxy", async (req, reply) => {
  const started = Date.now();
  let decision: "allow" | "deny" = "deny";
  let status = 0;
  let target = "";

  try {
    // 1) Validación básica
    const body = req.body as {
      method: string; url: string; headers?: Record<string, string>;
      body?: any; traceId?: string;
    };
    if (!body?.method || !body?.url) {
      reply.code(400).send({ error: "bad_request" }); return;
    }
    target = body.url;

    // 2) Allowlist
    const allowed = (process.env.ALLOW_HOSTS || "")
      .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const host = hostFrom(body.url);
    if (!host || !allowed.includes(host)) {
      decision = "deny"; status = 403;
      reply.code(403).send({ allowed: false, reason: "domain-not-allowed" });
      return;
    }

    // 3) Firma HMAC (no romper si no hay clave)
    const ts = Date.now().toString();
    const payload = JSON.stringify({ method: body.method, url: body.url, traceId: body.traceId || "", ts });
    const sig = signHmac(process.env.HMAC_KEY, payload);

    // 4) Proxy con timeout
    const { signal, cancel } = withTimeout(8000);
    const upstream = await fetch(body.url, {
      method: body.method,
      headers: {
        ...(body.headers || {}),
        ...(sig ? { "x-toolgate-sig": sig, "x-toolgate-ts": ts, "x-toolgate-trace": body.traceId || "" } : {}),
      },
      body: body.body ? (typeof body.body === "string" ? body.body : JSON.stringify(body.body)) : undefined,
      signal,
    }).finally(() => cancel());

    decision = "allow";
    status = upstream.status;
    const raw = await upstream.arrayBuffer();

    // 5) Propagar status/headers básicos (filtrados)
    const headers: Record<string, string> = {};
    upstream.headers.forEach((v, k) => {
      if (["content-type", "content-length"].includes(k)) headers[k] = v;
    });

    reply.code(status).headers(headers).send(Buffer.from(raw));
  } catch (e: any) {
    console.error("[gateway] proxy error:", e?.message || e);
    status = 502;
    reply.code(502).send({ error: "upstream_error" });
  } finally {
    const latencyMs = Date.now() - started;
    await emitEvent((req.body as any)?.traceId || "", { decision, target, status, latencyMs });
  }
});

// healthcheck
app.get("/healthz", async () => ({ ok: true }));

const port = Number(process.env.PORT) || 8787;
await app.listen({ host: "0.0.0.0", port });
console.log("gateway listening on", port);