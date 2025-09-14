import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import fastify from "fastify";
import { ProxyRequestSchema, type ProxyRequest } from "./types.js";
import { makeHostAllowChecker } from "./allowlist.js";
import { makeEventEmitter } from "./events.js";

const HOST = "0.0.0.0";
const PORT_STR = process.env.PORT;
if (!PORT_STR) {
  console.error("[gateway] FALTA process.env.PORT (Railway lo inyecta).");
  process.exit(1);
}
const PORT = Number(PORT_STR);

// ENV requeridas/sugeridas
const HMAC_KEY = process.env.HMAC_KEY || ""; // firma opcional hacia Collector
const COLLECTOR_URL = process.env.COLLECTOR_URL || ""; // usar pública en debug
const ALLOW_HOSTS = process.env.ALLOW_HOSTS || ""; // ej: "httpbin.org,.example.com"

const app = fastify({ logger: true });

// healthz
app.get("/healthz", async () => ({ ok: true }));

// allowlist
const isAllowed = makeHostAllowChecker(ALLOW_HOSTS);

// emisor de eventos
const events = makeEventEmitter({
  collectorURL: COLLECTOR_URL,
  hmacKey: HMAC_KEY,
  logger: (o, msg) => app.log.warn(o, msg)
});

// /v1/proxy
app.post("/v1/proxy", async (req, reply) => {
  let body: ProxyRequest;
  try {
    body = ProxyRequestSchema.parse(req.body);
  } catch (e: any) {
    return reply.code(400).send({ error: "invalid_proxy_payload", detail: String(e?.message ?? e) });
  }

  const { method, url, headers = {}, traceId } = body;

  // allowlist
  if (!isAllowed(url)) {
    const evt = {
      traceId,
      type: "gate.decision",
      ts: new Date().toISOString(),
      attrs: { allowed: false, reason: "domain-not-allowed", url }
    };
    events.emit(evt);
    return reply.code(403).send({ allowed: false, reason: "domain-not-allowed" });
  }

  // construir request a upstream
  const m = (method ?? "GET").toUpperCase();
  const h = new Headers(headers);
  // (opcional) aquí puedes sanear/filtrar headers salientes si quieres

  try {
    const res = await fetch(url, {
      method: m,
      headers: h,
      body: ["GET", "HEAD"].includes(m) ? undefined : serializeBody(body.body)
    });

    // copiamos status/headers y devolvemos como texto (para no romper binarios)
    const text = await res.text();
    for (const [k, v] of res.headers) reply.header(k, v);
    reply.code(res.status);

    // evento no bloqueante
    events.emit({
      traceId,
      type: "proxy.forward",
      ts: new Date().toISOString(),
      attrs: { url, method: m, status: res.status, ok: res.ok }
    });

    return reply.send(text);
  } catch (err: any) {
    // upstream error → 502
    events.emit({
      traceId,
      type: "proxy.error",
      ts: new Date().toISOString(),
      attrs: { url, method: m, message: String(err) }
    });
    return reply.code(502).send({ error: "upstream_error" });
  }
});

function serializeBody(b: unknown): string | undefined {
  if (b == null) return undefined;
  if (typeof b === "string") return b;
  return JSON.stringify(b);
}

(async () => {
  try {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`[gateway] listening on ${HOST}:${PORT}`);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
})();

// cierre limpio
process.on("SIGTERM", async () => {
  try {
    await app.close();
  } finally {
    process.exit(0);
  }
});