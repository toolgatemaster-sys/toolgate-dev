import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import fastify from "fastify";
import { EventSchema, type ToolgateEvent } from "./types.js";
import { MemoryStorage } from "./storage.memory.js";
import { PgStorage } from "./storage.pg.js";
import type { Storage } from "./storage.js";
import { createHash, timingSafeEqual } from "node:crypto";

const HOST = "0.0.0.0";
const PORT_STR = process.env.PORT;
if (!PORT_STR) {
  console.error("[collector] FALTA process.env.PORT (Railway lo inyecta).");
  process.exit(1);
}
const PORT = Number(PORT_STR);

// HMAC opcional (si se define, se exige)
const HMAC_KEY = process.env.HMAC_KEY || "";

function verifyHmacIfPresent(rawBody: string, headerSig: string | undefined): boolean {
  if (!HMAC_KEY) return true; // si no hay clave, permitimos todo
  if (!headerSig) return false;
  // Firma simple: sha256(body + HMAC_KEY)
  const h = createHash("sha256").update(rawBody + HMAC_KEY).digest();
  const given = Buffer.from(headerSig, "hex");
  return given.length === h.length && timingSafeEqual(given, h);
}

// Selección de storage
let storage: Storage;
const dbURL = process.env.DATABASE_URL;
if (dbURL) {
  console.log("[collector] Usando Postgres:", obfuscate(dbURL));
  storage = new PgStorage(dbURL);
} else {
  console.warn("[collector] Sin DATABASE_URL → usando almacenamiento en memoria.");
  storage = new MemoryStorage();
}

function obfuscate(url: string) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://***:***@");
}

const app = fastify({
  logger: true,
  // necesitamos el raw body para HMAC (si lo activas)
  bodyLimit: 5 * 1024 * 1024
});

// registrar hook para capturar raw body
app.addContentTypeParser("application/json", { parseAs: "string" }, function (req, body, done) {
  try {
    done(null, body);
  } catch (err) {
    done(err as Error);
  }
});

app.get("/healthz", async () => ({ ok: true }));

app.post("/v1/events", async (req, reply) => {
  // req.body es string por el parser anterior
  const raw = req.body as string;
  const sig = req.headers["x-toolgate-sig"] as string | undefined;

  if (!verifyHmacIfPresent(raw ?? "", sig)) {
    return reply.code(401).send({ ok: false, error: "invalid_hmac" });
  }

  let parsed: ToolgateEvent;
  try {
    const json = JSON.parse(raw ?? "{}");
    parsed = EventSchema.parse(json);
  } catch (e: any) {
    return reply.code(400).send({ ok: false, error: "invalid_payload", detail: String(e?.message ?? e) });
  }

  const res = await storage.saveEvent(parsed);
  return reply.send({ ok: true, eventId: res.eventId });
});

app.get("/v1/traces/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  if (!id) return reply.code(400).send({ ok: false, error: "missing_trace_id" });

  const trace = await storage.getTrace(id);
  return reply.send(trace);
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

// cierre limpio
process.on("SIGTERM", async () => {
  try {
    await app.close();
  } finally {
    process.exit(0);
  }
});