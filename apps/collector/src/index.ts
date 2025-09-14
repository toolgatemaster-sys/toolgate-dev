// apps/collector/src/index.ts
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import fastify from "fastify";
import { createHash, timingSafeEqual } from "node:crypto";
import { EventSchema, TraceResponseSchema, type ToolgateEvent } from "./types.js";
import { MemoryStorage } from "./storage.memory.js";
import { PgStorage } from "./storage.pg.js";
import type { Storage } from "./storage.js";

const HOST = "0.0.0.0";
const PORT_STR = process.env.PORT;
if (!PORT_STR) { console.error("[collector] FALTA process.env.PORT"); process.exit(1); }
const PORT = Number(PORT_STR);

const SAFE_MODE = process.env.SAFE_MODE === "1";
const HMAC_KEY = process.env.HMAC_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL;

(async () => {
  const app = fastify({ logger: true, bodyLimit: 5 * 1024 * 1024 });

  // Siempre registra healthz ANTES de cualquier otra cosa
  app.get("/healthz", async () => ({ ok: true, safe: SAFE_MODE }));

  if (SAFE_MODE) {
    // En SAFE_MODE no registramos parsers ni rutas extra
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`[collector] SAFE_MODE=1 listening on ${HOST}:${PORT}`);
    process.on("SIGTERM", async () => { try { await app.close(); } finally { process.exit(0); } });
    return; // <- ¡clave! nada más después de escuchar
  }

  // --- NO-SAFE: a partir de aquí sí registramos parser/rutas/DB ---
  // Necesitamos raw body (string) para HMAC
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    try { done(null, body as string); } catch (e) { done(e as Error); }
  });

  // Storage con fallback
  let storage: Storage;
  try {
    if (DATABASE_URL) {
      const pg = new PgStorage(DATABASE_URL);
      await pg.init();
      storage = pg;
      app.log.info("[collector] DB OK");
    } else {
      const mem = new MemoryStorage();
      await mem.init();
      storage = mem;
      app.log.warn("[collector] Using in-memory storage");
    }
  } catch (e) {
    app.log.error({ err: String(e) }, "[collector] DB init failed → fallback memory");
    const mem = new MemoryStorage();
    await mem.init();
    storage = mem;
  }

  // Rutas
  app.post("/v1/events", async (req, reply) => {
    const raw = req.body as string | undefined;
    const sig = req.headers["x-toolgate-sig"] as string | undefined;
    if (!verifyHmacIfPresent(raw ?? "", sig)) {
      return reply.code(401).send({ ok: false, error: "invalid_hmac" });
    }
    try {
      const parsed = EventSchema.parse(JSON.parse(raw ?? "{}"));
      const res = await storage.saveEvent(parsed);
      return reply.send({ ok: true, eventId: res.eventId });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return reply.code(400).send({ ok: false, error: "invalid_payload", detail });
    }
  });

  app.get("/v1/traces/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!id) return reply.code(400).send({ ok: false, error: "missing_trace_id" });
    const trace = await storage.getTrace(id);
    const safe = TraceResponseSchema.safeParse(trace);
    if (!safe.success) {
      app.log.error({ err: safe.error }, "TraceResponse schema mismatch");
      return reply.code(500).send({ ok: false, error: "schema_mismatch" });
    }
    return reply.send(safe.data);
  });

  await app.listen({ host: HOST, port: PORT });
  app.log.info(`[collector] listening on ${HOST}:${PORT}`);

  process.on("SIGTERM", async () => { try { await app.close(); } finally { process.exit(0); } });

  function verifyHmacIfPresent(rawBody: string, headerSig: string | undefined): boolean {
    if (!HMAC_KEY) return true;
    if (!headerSig) return false;
    const h = createHash("sha256").update(rawBody + HMAC_KEY).digest();
    const given = Buffer.from(headerSig, "hex");
    return given.length === h.length && timingSafeEqual(given, h);
  }
})();