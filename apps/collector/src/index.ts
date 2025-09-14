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

const HMAC_KEY = process.env.HMAC_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL;

(async () => {
  const app = fastify({ logger: true, bodyLimit: 5 * 1024 * 1024 });

  // justo después de crear `const app = fastify({ logger: true, bodyLimit: ... })`
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? ""; // pon algo como "secret123" en Railway
  let runtime = {
    safe: process.env.SAFE_MODE === "1",   // empieza en lo que diga el env
    storage: "memory" as "memory" | "pg"   // forzamos memoria para iniciar rápido
  };

  // healthz siempre disponible
  app.get("/healthz", async () => ({ ok: true, safe: runtime.safe, storage: runtime.storage }));

  app.get("/", async () => {
    return { ok: true, service: "collector" };
  });

  // --- TOGGLES ADMIN (no requieren redeploy) ---
  app.post("/__admin/toggle", async (req, reply) => {
    const auth = req.headers["x-admin-token"];
    if (!ADMIN_TOKEN || auth !== ADMIN_TOKEN) return reply.code(401).send({ ok: false });
    const body = req.body as any;
    if (typeof body?.safe === "boolean") runtime.safe = body.safe;
    if (body?.storage === "memory" || body?.storage === "pg") runtime.storage = body.storage;
    return reply.send({ ok: true, runtime });
  });
  app.get("/__admin/runtime", async (req, reply) => {
    const auth = req.headers["x-admin-token"];
    if (!ADMIN_TOKEN || auth !== ADMIN_TOKEN) return reply.code(401).send({ ok: false });
    return reply.send({ ok: true, runtime });
  });

  // SAFE MODE: escucha solo healthz + admin y listo
  if (runtime.safe) {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`[collector] SAFE_MODE=1 listening on ${HOST}:${PORT}`);
    process.on("SIGTERM", async () => { try { await app.close(); } finally { process.exit(0); } });
    return;
  }

  // A partir de acá, MODO NORMAL: registra parsers/rutas y storage
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    try { done(null, body as string); } catch (e) { done(e as Error); }
  });

  // selecciona storage según `runtime.storage`
  let storage: Storage;
  if (runtime.storage === "pg" && process.env.DATABASE_URL) {
    try {
      const pg = new PgStorage(process.env.DATABASE_URL);
      await pg.init();
      storage = pg;
      app.log.info("[collector] DB OK");
    } catch (e) {
      app.log.error({ err: String(e) }, "[collector] DB init failed → fallback memory");
      const mem = new MemoryStorage(); await mem.init(); storage = mem; runtime.storage = "memory";
    }
  } else {
    const mem = new MemoryStorage(); await mem.init(); storage = mem;
    app.log.warn("[collector] Using in-memory storage");
  }

  // rutas normales
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