import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import fastify from 'fastify';
import { z } from 'zod';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8080);

const app = fastify({ logger: true });

// health & raíz (como sanitizer)
app.get('/healthz', async () => ({ ok: true, service: 'collector', storage: 'memory' }));
app.get('/', async () => ({ ok: true, service: 'collector' }));

// --------- tipos + storage en memoria ----------
type ToolgateEvent = {
  traceId: string;
  type: string;
  ts: string; // ISO
  attrs: Record<string, unknown>;
};
const EventSchema = z.object({
  traceId: z.string().min(1),
  type: z.string().min(1),
  ts: z.string().min(1),
  attrs: z.record(z.unknown()).default({}),
});
const traces = new Map<string, ToolgateEvent[]>();

// POST /v1/events
app.post('/v1/events', async (req, reply) => {
  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as unknown;
    const ev = EventSchema.parse(body);
    const list = traces.get(ev.traceId) ?? [];
    list.push(ev);
    traces.set(ev.traceId, list);
    return reply.send({ ok: true, eventId: `${ev.traceId}:${list.length}` });
  } catch (err) {
    app.log.error({ err }, 'events.invalid_payload');
    return reply.code(400).send({ ok: false, error: 'invalid_payload' });
  }
});

// GET /v1/traces/:id
app.get('/v1/traces/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const events = traces.get(id) ?? [];
  return reply.send({ traceId: id, events });
});

// arrancar
app.listen({ host: HOST, port: PORT }).then(() => {
  app.log.info(`[collector] listening on ${HOST}:${PORT}`);
}).catch((err) => {
  console.error('listen failed', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  try { await app.close(); } finally { process.exit(0); }
});