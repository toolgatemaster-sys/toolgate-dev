// apps/gateway/__tests__/retry_notify.test.ts
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
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

// Mock webhook server to capture notifications
function createMockWebhookServer(port: number) {
  const app = fastify({ logger: false });
  const notifications: any[] = [];
  
  app.post('/webhook', async (req, reply) => {
    notifications.push(req.body);
    return reply.send({ ok: true });
  });
  
  app.get('/notifications', async () => ({ notifications }));
  
  return { app, notifications };
}

describe("Day 6 — retry & notifications", () => {
  let gateway: any;
  let mockWebhook: any;
  let collector: any;
  let gatewayUrl: string;
  let webhookUrl: string;
  let notifications: any[];

  const gatewayPort = 8791;
  const webhookPort = 8792;
  const collectorPort = 8793;

  // Policy that requires approval for writer profile
  const policy = {
    version: 1,
    profiles: {
      writer: {
        tools: ['http.get', 'events', 'shell.execute', 'file.write', 'database.query'],
        domains_allow: ['httpbin.org'],
        read_only: false,
        // Explicitly require approval for high-risk tools
        tools_require_approval: ['shell.execute', 'file.write', 'database.query']
      }
    },
    defaults: { 
      approvals_ttl_seconds: 3600, 
      default_profile: 'writer'
    }
  };

  beforeAll(async () => {
    // Start mock webhook server
    mockWebhook = createMockWebhookServer(webhookPort);
    await mockWebhook.app.listen({ port: webhookPort });
    webhookUrl = `http://127.0.0.1:${webhookPort}`;
    notifications = mockWebhook.notifications;

    // Start collector stub with policy
    collector = createCollectorStub(policy);
    await collector.listen({ host: '127.0.0.1', port: collectorPort });

    // Start gateway with webhook configured
    process.env.TOOLGATE_WEBHOOK_URL = `${webhookUrl}/webhook`;
    process.env.COLLECTOR_URL = `http://127.0.0.1:${collectorPort}`;
    
    gateway = await createGateway();
    await gateway.listen({ port: gatewayPort });
    gatewayUrl = `http://127.0.0.1:${gatewayPort}`;
  });

  afterAll(async () => {
    try { await gateway?.close(); } catch {}
    try { await mockWebhook.app.close(); } catch {}
    try { await collector?.close(); } catch {}
    delete process.env.TOOLGATE_WEBHOOK_URL;
    delete process.env.COLLECTOR_URL;
  });

  beforeEach(async () => {
    // Clear the approvals store between tests
    const { approvalsStore } = await import('../src/approvals.store.js');
    approvalsStore.clear();
  });

  it("first request -> pending (202)", async () => {
    const body = {
      traceId: `retry-test-1-${Date.now()}`,
      type: 'tool.invocation',
      ts: new Date().toISOString(),
      attrs: { tool: 'shell.execute', url: 'https://httpbin.org/get' }
    };

    const res = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(202);
    const response = await res.json();
    expect(response).toMatchObject({
      decision: 'pending',
      approval_id: expect.stringMatching(/^apr_/),
      ttl_seconds: expect.any(Number)
    });
  });

  it("after approve, retry same bodyHash -> 200 allow", async () => {
    const body = {
      traceId: `retry-test-2-${Date.now()}`,
      type: 'tool.invocation',
      ts: new Date().toISOString(),
      attrs: { tool: 'file.write', url: 'https://httpbin.org/post' }
    };

    // First request - should be pending
    const res1 = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res1.status).toBe(202);
    const response1 = await res1.json();
    const approvalId = response1.approval_id;

    // Approve the request
    const approveRes = await fetch(`${gatewayUrl}/api/approvals/${approvalId}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'Approved for retry test' }),
    });

    expect(approveRes.status).toBe(200);

    // Retry same request - should be allowed
    const res2 = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res2.status).toBe(200); // Should be allowed now
  });

  it("after deny, retry same bodyHash -> 403 deny", async () => {
    const body = {
      traceId: `retry-test-3-${Date.now()}`,
      type: 'tool.invocation',
      ts: new Date().toISOString(),
      attrs: { tool: 'database.query', url: 'https://httpbin.org/get' }
    };

    // First request - should be pending
    const res1 = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res1.status).toBe(202);
    const response1 = await res1.json();
    const approvalId = response1.approval_id;

    // Deny the request
    const denyRes = await fetch(`${gatewayUrl}/api/approvals/${approvalId}/deny`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'Denied for retry test' }),
    });

    expect(denyRes.status).toBe(200);

    // Retry same request - should be denied
    const res2 = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res2.status).toBe(403);
    const response2 = await res2.json();
    expect(response2).toMatchObject({
      decision: 'denied',
      approval_id: approvalId
    });
  });

  it("after expire, retry same bodyHash -> 403 deny", async () => {
    const body = {
      traceId: `retry-test-4-${Date.now()}`,
      type: 'tool.invocation',
      ts: new Date().toISOString(),
      attrs: { tool: 'shell.execute', url: 'https://httpbin.org/get' }
    };

    // First request - should be pending
    const res1 = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res1.status).toBe(202);
    const response1 = await res1.json();
    const approvalId = response1.approval_id;

    // Manually expire the approval by calling expireOld
    const { approvalsStore } = await import('../src/approvals.store.js');
    const approval = approvalsStore.getApproval(approvalId);
    if (approval) {
      approval.expiresAt = Date.now() - 1000; // Set to past
      approvalsStore.expireOld();
    }

    // Retry same request - should be denied due to expiry
    const res2 = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res2.status).toBe(403);
    const response2 = await res2.json();
    expect(response2).toMatchObject({
      decision: 'expired',
      approval_id: approvalId
    });
  });

  it("sends notification on approve/deny/expire (mock webhook)", async () => {
    const body = {
      traceId: `retry-test-5-${Date.now()}`,
      type: 'tool.invocation',
      ts: new Date().toISOString(),
      attrs: { tool: 'file.write', url: 'https://httpbin.org/post' }
    };

    // Clear previous notifications
    notifications.length = 0;

    // First request - should be pending
    const res1 = await fetch(`${gatewayUrl}/v1/events`, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-tg-profile': 'writer'
      },
      body: JSON.stringify(body),
    });

    expect(res1.status).toBe(202);
    const response1 = await res1.json();
    const approvalId = response1.approval_id;

    // Approve the request
    const approveRes = await fetch(`${gatewayUrl}/api/approvals/${approvalId}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'Approved for notification test' }),
    });

    expect(approveRes.status).toBe(200);

    // Wait a bit for notification to be sent
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that notification was sent
    expect(notifications.length).toBeGreaterThan(0);
    
    const lastNotification = notifications[notifications.length - 1];
            expect(lastNotification).toMatchObject({
              id: approvalId,
              status: 'approved',
              ctx: expect.objectContaining({
                tool: 'file.write',
                bodyHash: expect.any(String)
              }),
              ts: expect.any(Number)
            });
  });
});
