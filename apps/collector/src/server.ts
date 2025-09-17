import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');
import fastify from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { metricsPlugin } from './metrics.plugin.js';

export async function createCollector() {
  const app = fastify({ logger: false });
  
  // Register metrics plugin
  await app.register(metricsPlugin);
  
  // Health check
  app.get('/healthz', async () => ({ 
    ok: true, 
    service: 'collector', 
    storage: 'memory' 
  }));
  
  // Root route
  app.get('/', async () => ({ ok: true, service: 'collector' }));
  
  // Types
  type ToolgateEvent = {
    traceId: string;
    type: string;
    ts: string;
    attrs: Record<string, unknown>;
  };
  
  const EventSchema = z.object({
    traceId: z.string().min(1),
    type: z.string().min(1),
    ts: z.string().min(1),
    attrs: z.record(z.unknown()).default({}),
  });
  
  // In-memory storage
  const traces = new Map<string, ToolgateEvent[]>();
  
  // POST /v1/events
  app.post('/v1/events', async (req, reply) => {
    try {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as unknown;
      const ev = EventSchema.parse(body);
      const eventId = randomUUID();
      
      const list = traces.get(ev.traceId) ?? [];
      list.push({ ...ev, eventId } as ToolgateEvent & { eventId: string });
      traces.set(ev.traceId, list);
      
      return reply.send({ ok: true, eventId });
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
  
  return app;
}
