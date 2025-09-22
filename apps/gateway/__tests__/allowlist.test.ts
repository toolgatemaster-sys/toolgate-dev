import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import fastify from 'fastify';
import { createGateway } from '../src/server.js';

// Minimal in-memory collector stub that serves an active policy and accepts events
function createCollectorStub(policy: any) {
  const app = fastify({ logger: false });
  app.get('/healthz', async () => ({ ok: true, service: 'collector-stub' }));
  app.get('/v1/policies/active', async () => ({ ok: true, active: { policy } }));
  app.post('/v1/events', async (req, reply) => {
    // Accept any event
    return reply.code(200).send({ ok: true, stored: true });
  });
  return app;
}

describe('Gateway Allowlist Enforcement', () => {
  const collectorPort = 8787;
  const gatewayPort = 8788;

  const policy = {
    version: 1,
    profiles: {
      anonymous: {
        tools: ['http.get', 'events'],
        domains_allow: ['httpbin.org'],
        read_only: true,
      },
      writer: {
        tools: ['http.get', 'events'],
        domains_allow: ['httpbin.org'],
        read_only: false,
      }
    },
    defaults: { approvals_ttl_seconds: 300, default_profile: 'anonymous' }
  };

  let collector: any;
  let gateway: any;

  beforeAll(async () => {
    // Start collector stub
    collector = createCollectorStub(policy);
    await collector.listen({ host: '127.0.0.1', port: collectorPort });

    // Point gateway to collector
    process.env.COLLECTOR_URL = `http://127.0.0.1:${collectorPort}`;

    // Start gateway
    gateway = await createGateway();
    await gateway.listen({ host: '127.0.0.1', port: gatewayPort });
  });

  afterAll(async () => {
    try { await gateway?.close(); } catch {}
    try { await collector?.close(); } catch {}
  });

  it('ALLOW: allowed domain and read method should pass', async () => {
    const ev = {
      traceId: 'allow-1',
      type: 'tool.invocation',
      ts: new Date().toISOString(),
      attrs: { tool: 'http.get', url: 'https://httpbin.org/get' }
    };

    const res = await fetch(`http://127.0.0.1:${gatewayPort}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tg-profile': 'writer' },
      body: JSON.stringify(ev),
    });

    expect(res.status).toBeLessThan(300);
  });

  it('DENY: non-allowed domain should be blocked with 403', async () => {
    const ev = {
      traceId: 'deny-1',
      type: 'tool.invocation',
      ts: new Date().toISOString(),
      attrs: { tool: 'http.get', url: 'https://evil.example.com/' }
    };

    const res = await fetch(`http://127.0.0.1:${gatewayPort}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tg-profile': 'anonymous' },
      body: JSON.stringify(ev),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toMatchObject({ decision: 'deny' });
  });

  it('READ-ONLY: POST with read_only profile should be denied', async () => {
    const ev = {
      traceId: 'ro-1',
      type: 'custom.event',
      ts: new Date().toISOString(),
      attrs: { tool: 'events', message: 'write attempt' }
    };

    const res = await fetch(`http://127.0.0.1:${gatewayPort}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tg-profile': 'anonymous' },
      body: JSON.stringify(ev),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toMatchObject({ decision: 'deny' });
  });
});


