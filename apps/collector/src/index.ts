import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import fastify, { type FastifyInstance } from "fastify";
import { createHash, timingSafeEqual } from "node:crypto";
import { EventSchema, TraceResponseSchema, type ToolgateEvent } from "./types.js";
import { MemoryStorage } from "./storage.memory.js";
import { PgStorage } from "./storage.pg.js";
import type { Storage } from "./storage.js";

const HOST = "0.0.0.0";
const PORT_STR = process.env.PORT;
if (!PORT_STR) {
  // fallar ruidoso si Railway no inyecta PORT
  console.error("[collector] FALTA process.env.PORT");
  process.exit(1);
}
const PORT = Number(PORT_STR);

const HMAC_KEY = process.env.HMAC_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL;

const storage: Storage = DATABASE_URL
  ? (console.log("[collector] Usando Postgres (pooler):", obfuscate(DATABASE_URL)), new PgStorage(DATABASE_URL))
  : (console.warn("[collector] Sin DATABASE_URL → usando memoria"), new MemoryStorage());

const app: FastifyInstance = fastify({ logger: true, bodyLimit: 5 * 1024 * 1024 });

// Necesitamos raw body para HMAC: definimos un parser "string"
app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
  try { done(null, body as string); } catch (e) { done(e as Error); }
});

app.get("/healthz", async () => ({ ok: true }));

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
  // valida también la salida (opcional, pero útil)
  const safe = TraceResponseSchema.safeParse(trace);
  if (!safe.success) {
    app.log.error({ err: safe.error }, "TraceResponse schema mismatch");
    return reply.code(500).send({ ok: false, error: "schema_mismatch" });
  }
  return reply.send(safe.data);
});

(async () => {
  try {
    await storage.init();
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`[collector] listening on ${HOST}:${PORT}`);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
})();

process.on("SIGTERM", async () => {
  try { await app.close(); } finally { process.exit(0); }
});

// ─ helpers ─
function verifyHmacIfPresent(rawBody: string, headerSig: string | undefined): boolean {
  if (!HMAC_KEY) return true;
  if (!headerSig) return false;
  const h = createHash("sha256").update(rawBody + HMAC_KEY).digest();
  const given = Buffer.from(headerSig, "hex");
  return given.length === h.length && timingSafeEqual(given, h);
}

function obfuscate(url: string): string {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://***:***@");
}