// apps/gateway/src/index.ts
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import fastify from 'fastify';
import { z } from 'zod';
import cors from '@fastify/cors';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8080);

const COLLECTOR_URL = process.env.COLLECTOR_URL; // ej: https://toolgate-collector-production.up.railway.app
const SANITIZER_URL = process.env.SANITIZER_URL;
const REQUIRE_SANITIZER = process.env.REQUIRE_SANITIZER === '1';
if (!COLLECTOR_URL) {
  console.error('[gateway] FALTA COLLECTOR_URL');
  process.exit(1);
}

const app = fastify({ logger: true });
// CORS
app.register(cors, {
  origin: true
});

app.get('/healthz', async () => ({
  ok: true,
  service: 'gateway',
  upstream: { collector: COLLECTOR_URL }
}));

// raíz
app.get('/', async () => ({ ok: true, service: 'gateway' }));

// --- helpers: timeout + 1 retry ---
function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(t) };
}

async function fetchUpstream(url: string, init: RequestInit, timeoutMs = 2000) {
  const t1 = withTimeout(timeoutMs);
  try {
    return await fetch(url, { ...init, signal: t1.signal });
  } catch (_) {
    const t2 = withTimeout(timeoutMs);
    try {
      return await fetch(url, { ...init, signal: t2.signal });
    } finally {
      t2.clear();
    }
  } finally {
    t1.clear();
  }
}

// schema del evento (igual que collector)
const EventSchema = z.object({
  traceId: z.string().min(1),
  type: z.string().min(1),
  ts: z.string().min(1),
  attrs: z.record(z.unknown()).default({})
});

// --- integración con Sanitizer (real: /v1/sanitize-context) ---
async function sanitizeIntoAttrs(ev: z.infer<typeof EventSchema>): Promise<z.infer<typeof EventSchema>> {
  if (!SANITIZER_URL) return ev;

  const text = String((ev.attrs as Record<string, unknown>)?.text ?? '');
  if (!text) return ev; // nada que sanear

  const sreq = { text, stripHtml: true, defang: true, spotlight: true };
  const res = await fetchUpstream(`${SANITIZER_URL}/v1/sanitize-context`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sreq)
  }, 1500);

  if (!res.ok) {
    if (REQUIRE_SANITIZER) throw new Error(`sanitizer ${res.status}`);
    // fallback: no tocar attrs
    return ev;
  }

  const { clean, score, signals, analysis, spotlighted } = await res.json() as {
    clean: string; score?: unknown; signals?: unknown; analysis?: unknown; spotlighted?: unknown;
  };

  const nextAttrs = { ...(ev.attrs as Record<string, unknown>) };
  nextAttrs.text = clean; // reemplaza el texto con la versión limpia
  nextAttrs._sanitizer = { score, signals, analysis, spotlighted };

  return { ...ev, attrs: nextAttrs };
}

// POST /v1/events -> proxy a collector
app.post('/v1/events', async (req, reply) => {
  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const ev = EventSchema.parse(raw as unknown);

    // 1) sanitiza (respeta REQUIRE_SANITIZER con fallback)
    let clean = ev;
    try {
      clean = await sanitizeIntoAttrs(ev);
    } catch (sanErr) {
      if (REQUIRE_SANITIZER) {
        req.log.error({ err: String(sanErr) }, 'sanitize_failed_require');
        return reply.code(400).send({ ok: false, error: 'sanitize_failed' });
      } else {
        req.log.warn({ err: String(sanErr) }, 'sanitize_failed_fallback_raw');
        clean = ev; // continuar crudo
      }
    }

    // 2) envía al collector
    const res = await fetchUpstream(`${COLLECTOR_URL}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(clean)
    });

    const body = await res.text();
    reply.code(res.status).headers(Object.fromEntries(res.headers as any));
    return reply.send(body);
  } catch (err) {
    app.log.error({ err }, 'gateway.events.sanitize_or_proxy_failed');
    return reply.code(400).send({ ok: false, error: 'invalid_or_sanitize_failed' });
  }
});

// GET /v1/traces/:id -> proxy a collector
app.get('/v1/traces/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const res = await fetchUpstream(`${COLLECTOR_URL}/v1/traces/${encodeURIComponent(id)}`, { method: 'GET' });
    const body = await res.text();
    reply.code(res.status).headers(Object.fromEntries(res.headers as any));
    return reply.send(body);
  } catch (err) {
    app.log.error({ err }, 'gateway.traces.proxy_failed');
    return reply.code(502).send({ ok: false, error: 'upstream_error' });
  }
});

app.listen({ host: HOST, port: PORT })
  .then(() => app.log.info(`[gateway] listening on ${HOST}:${PORT}`))
  .catch((e) => { app.log.error(e, 'listen failed'); process.exit(1); });

process.on('SIGTERM', async () => { try { await app.close(); } finally { process.exit(0); } });