// apps/gateway/src/index.ts
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import fastify from "fastify";
import { ProxyRequestSchema, type ProxyRequest } from "./types.js";
import { makeHostAllowChecker } from "./allowlist.js";
import { makeEventEmitter } from "./events.js";

const HOST = "0.0.0.0";
const PORT_STR = process.env.PORT;
if (!PORT_STR) { console.error("[gateway] FALTA process.env.PORT"); process.exit(1); }
const PORT = Number(PORT_STR);

const SAFE_MODE = process.env.SAFE_MODE === "1";
const HMAC_KEY = process.env.HMAC_KEY ?? "";
const COLLECTOR_URL = process.env.COLLECTOR_URL ?? "";
const ALLOW_HOSTS = process.env.ALLOW_HOSTS ?? "";

(async () => {
  const app = fastify({ logger: true });

  // Healthz SIEMPRE primero
  app.get("/healthz", async () => ({ ok: true, safe: SAFE_MODE }));

  if (SAFE_MODE) {
    // 🔒 SAFE MODE: no registres rutas extra
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`[gateway] SAFE_MODE=1 listening on ${HOST}:${PORT}`);
    process.on("SIGTERM", async () => { try { await app.close(); } finally { process.exit(0); } });
    return; // ⬅️ importantísimo: no sigas registrando rutas
  }

  // ------- MODO NORMAL: registra TODO ANTES de listen -------
  const isAllowed = makeHostAllowChecker(ALLOW_HOSTS);
  const events = makeEventEmitter({
    collectorURL: COLLECTOR_URL,
    hmacKey: HMAC_KEY,
    logger: (o, msg) => app.log.warn(o, msg)
  });

  app.post("/v1/proxy", async (req, reply) => {
    let body: ProxyRequest;
    try {
      body = ProxyRequestSchema.parse(req.body);
    } catch (e: unknown) {
      return reply.code(400).send({ error: "invalid_proxy_payload", detail: String((e as Error).message ?? e) });
    }

    const { method = "GET", url, headers = {}, traceId } = body;

    if (!isAllowed(url)) {
      await events.emit({
        traceId, type: "gate.decision", ts: new Date().toISOString(),
        attrs: { allowed: false, reason: "domain-not-allowed", url }
      });
      return reply.code(403).send({ allowed: false, reason: "domain-not-allowed" });
    }

    try {
      const m = method.toUpperCase();
      const h = new Headers(headers);
      const res = await fetch(url, {
        method: m,
        headers: h,
        body: (m === "GET" || m === "HEAD") ? undefined : serialize(body.body)
      });

      const text = await res.text();
      for (const [k, v] of res.headers) reply.header(k, v);
      reply.code(res.status);

      events.emit({
        traceId, type: "proxy.forward", ts: new Date().toISOString(),
        attrs: { url, method: m, status: res.status, ok: res.ok }
      });

      return reply.send(text);
    } catch (err: unknown) {
      app.log.error({ err }, "proxy.fetch_failed");
      await events.emit({
        traceId, type: "proxy.error", ts: new Date().toISOString(),
        attrs: { url, method, message: String(err) }
      });
      return reply.code(502).send({ error: "upstream_error" });
    }
  });

  await app.listen({ host: HOST, port: PORT });
  app.log.info(`[gateway] listening on ${HOST}:${PORT}`);
  process.on("SIGTERM", async () => { try { await app.close(); } finally { process.exit(0); } });

  function serialize(b: unknown): string | undefined {
    if (b == null) return undefined;
    return typeof b === "string" ? b : JSON.stringify(b);
  }
})();