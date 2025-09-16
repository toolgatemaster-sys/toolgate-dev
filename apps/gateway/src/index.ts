// apps/gateway/src/index.ts
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import fastify from 'fastify';
import { z } from 'zod';
import cors from '@fastify/cors';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8080);

const COLLECTOR_URL = process.env.COLLECTOR_URL; // ej: https://toolgate-collector-production.up.railway.app
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

// POST /v1/events -> proxy a collector
app.post('/v1/events', async (req, reply) => {
  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const ev = EventSchema.parse(raw as unknown);

    const res = await fetchUpstream(`${COLLECTOR_URL}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ev)
    });

    const body = await res.text();
    reply.code(res.status).headers(Object.fromEntries(res.headers as any));
    return reply.send(body);
  } catch (err) {
    app.log.error({ err }, 'gateway.events.proxy_failed');
    return reply.code(502).send({ ok: false, error: 'upstream_error' });
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