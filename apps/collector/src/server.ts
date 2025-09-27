// Set DNS result order for IPv4 preference (safe for all environments)
try {
  const { setDefaultResultOrder } = await import('node:dns');
  if (typeof setDefaultResultOrder === 'function') {
    setDefaultResultOrder('ipv4first');
  }
} catch {
  // No-op in environments where node:dns is not available (e.g., some test environments)
}
import fastify from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { metricsPlugin } from './metrics.plugin.js';
import { policyStore } from './policies.store.js';
import { parseYaml } from '../../../packages/core/dist/policy.parser.js';
import { validatePolicy, validatePolicyEvaluationRequest } from '../../../packages/core/dist/policy.schema.js';

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

  // Policy routes
  // POST /v1/policies/publish
  app.post('/v1/policies/publish', async (req, reply) => {
    try {
      const body = req.body as { yaml?: string; policy?: unknown };
      
      let policy;
      if (body.yaml) {
        policy = parseYaml(body.yaml);
      } else if (body.policy) {
        policy = validatePolicy(body.policy);
      } else {
        return reply.code(400).send({ ok: false, error: 'Missing yaml or policy field' });
      }

      const version = await policyStore.publish(policy);
      return reply.send({ ok: true, version });
    } catch (err) {
      app.log.error({ err }, 'policies.publish.failed');
      return reply.code(400).send({ ok: false, error: 'Invalid policy' });
    }
  });

  // POST /v1/policies/dry-run
  app.post('/v1/policies/dry-run', async (req, reply) => {
    try {
      const request = validatePolicyEvaluationRequest(req.body);
      const result = await policyStore.dryRun(request);
      return reply.send({ ok: true, result });
    } catch (err) {
      app.log.error({ err }, 'policies.dry_run.failed');
      return reply.code(400).send({ ok: false, error: 'Invalid request' });
    }
  });

  // GET /v1/policies/active
  app.get('/v1/policies/active', async (req, reply) => {
    try {
      const active = await policyStore.getActive();
      if (!active) {
        return reply.send({ ok: true, active: null });
      }
      return reply.send({ ok: true, active });
    } catch (err) {
      app.log.error({ err }, 'policies.get_active.failed');
      return reply.code(500).send({ ok: false, error: 'Internal error' });
    }
  });

  // GET /v1/policies/versions
  app.get('/v1/policies/versions', async (req, reply) => {
    try {
      const versions = await policyStore.getAllVersions();
      return reply.send({ ok: true, versions });
    } catch (err) {
      app.log.error({ err }, 'policies.get_versions.failed');
      return reply.code(500).send({ ok: false, error: 'Internal error' });
    }
  });

  // POST /v1/policies/activate/:versionId
  app.post('/v1/policies/activate/:versionId', async (req, reply) => {
    try {
      const { versionId } = req.params as { versionId: string };
      const success = await policyStore.activateVersion(versionId);
      if (!success) {
        return reply.code(404).send({ ok: false, error: 'Version not found' });
      }
      return reply.send({ ok: true });
    } catch (err) {
      app.log.error({ err }, 'policies.activate.failed');
      return reply.code(500).send({ ok: false, error: 'Internal error' });
    }
  });
  
  return app;
}
