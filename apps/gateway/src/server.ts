import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');
import fastify from 'fastify';
import { z } from 'zod';
import cors from '@fastify/cors';
import { metricsPlugin } from './metrics.plugin.js';
import { createPolicyClient } from './policy.client.js';
import { createPolicyApplicator } from './policy.apply.js';
import { registerEnforcement } from './policy.enforce.js';

export async function createGateway() {
  const app = fastify({ logger: false });
  
  // Register metrics plugin
  await app.register(metricsPlugin);
  
  // Register CORS
  await app.register(cors, { origin: true });
  
  // Initialize policy enforcement
  const COLLECTOR_URL = process.env.COLLECTOR_URL;
  let policyApplicator: any = null;
  if (COLLECTOR_URL) {
    const policyClient = createPolicyClient(COLLECTOR_URL, 30000); // 30s TTL
    policyApplicator = createPolicyApplicator(policyClient);
    app.log.info('Policy enforcement enabled');
  } else {
    app.log.warn('No COLLECTOR_URL set, policy enforcement disabled');
  }
  
  // Health check
  app.get('/healthz', async () => ({ 
    ok: true, 
    service: 'gateway', 
    upstream: { collector: process.env.COLLECTOR_URL } 
  }));
  
  // Root route
  app.get('/', async () => ({ ok: true, service: 'gateway' }));
  
  const EventSchema = z.object({
    traceId: z.string().min(1),
    type: z.string().min(1),
    ts: z.string().min(1),
    attrs: z.record(z.unknown()).default({})
  });
  
  // Timeout and retry helper
  function withTimeout(ms: number) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, clear: () => clearTimeout(t) };
  }
  
  async function fetchUpstream(url: string, init: RequestInit, timeoutMs = 2000) {
    const t1 = withTimeout(timeoutMs);
    try {
      return await fetch(url, { ...init, signal: t1.signal });
    } catch (e) {
      // 1 retry rápido
      const t2 = withTimeout(timeoutMs);
      return await fetch(url, { ...init, signal: t2.signal });
    } finally {
      t1.clear();
    }
  }
  
  // Policy enforcement hook
  await registerEnforcement(app);

  // POST /v1/events -> proxy a collector
  app.post('/v1/events', async (req, reply) => {
    try {
      const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const ev = EventSchema.parse(raw as unknown);
      
      const COLLECTOR_URL = process.env.COLLECTOR_URL;
      if (!COLLECTOR_URL) {
        return reply.code(502).send({ ok: false, error: 'no_collector_url' });
      }
      
      const res = await fetchUpstream(`${COLLECTOR_URL}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ev),
      });
      
      const text = await res.text();
      reply.code(res.status);
      for (const [k, v] of res.headers) reply.header(k, v);
      return reply.send(text);
    } catch (err) {
      app.log.error({ err }, 'gateway.events.proxy_failed');
      return reply.code(502).send({ ok: false, error: 'upstream_error' });
    }
  });
  
  // GET /v1/traces/:id -> proxy a collector
  app.get('/v1/traces/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const COLLECTOR_URL = process.env.COLLECTOR_URL;
      if (!COLLECTOR_URL) {
        return reply.code(502).send({ ok: false, error: 'no_collector_url' });
      }
      
      const res = await fetchUpstream(`${COLLECTOR_URL}/v1/traces/${encodeURIComponent(id)}`, {
        method: 'GET'
      });
      
      const text = await res.text();
      reply.code(res.status);
      for (const [k, v] of res.headers) reply.header(k, v);
      return reply.send(text);
    } catch (err) {
      app.log.error({ err }, 'gateway.traces.proxy_failed');
      return reply.code(502).send({ ok: false, error: 'upstream_error' });
    }
  });
  
  return app;
}
