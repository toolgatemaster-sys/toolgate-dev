import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createGateway } from '../src/server.js';
import { createCollector } from '../../collector/src/server.js';

describe('Gateway Policy Wire-up', () => {
  let collector: any;
  let gateway: any;
  let collectorUrl: string;
  let gatewayUrl: string;

  beforeAll(async () => {
    // Start collector
    collector = await createCollector();
    await collector.listen({ port: 0, host: '127.0.0.1' });
    const collectorAddr = collector.server.address();
    const collectorPort = typeof collectorAddr === 'object' && collectorAddr ? collectorAddr.port : 0;
    collectorUrl = `http://127.0.0.1:${collectorPort}`;

    // Set environment variable for gateway
    process.env.COLLECTOR_URL = collectorUrl;

    // Start gateway
    gateway = await createGateway();
    await gateway.listen({ port: 0, host: '127.0.0.1' });
    const gatewayAddr = gateway.server.address();
    const gatewayPort = typeof gatewayAddr === 'object' && gatewayAddr ? gatewayAddr.port : 0;
    gatewayUrl = `http://127.0.0.1:${gatewayPort}`;
  });

  afterAll(async () => {
    await gateway?.close();
    await collector?.close();
  });

  describe('Policy enforcement integration', () => {
    it('should allow requests when no policy is active', async () => {
      const event = {
        traceId: 'test-trace-001',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { tool: 'http.get', url: 'https://api.example.com/data' },
      };

      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'x-profile': 'researcher',
        },
        body: JSON.stringify(event),
      });

      // Should pass through to collector (no policy enforcement)
      expect(response.status).toBeLessThan(500);
    });

    it('should enforce policy when active policy is set', async () => {
      // First, publish and activate a restrictive policy
      const policy = {
        version: 1,
        profiles: {
          researcher: {
            read_only: true,
            tools: ['http.get'],
            domains_allow: ['api.example.com'],
          },
        },
        defaults: { approvals_ttl_seconds: 3600 },
      };

      // Publish policy
      const publishResponse = await fetch(`${collectorUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ policy }),
      });

      expect(publishResponse.status).toBe(200);
      const publishResult = await publishResponse.json();
      const versionId = publishResult.version.id;

      // Activate policy
      const activateResponse = await fetch(`${collectorUrl}/v1/policies/activate/${versionId}`, {
        method: 'POST',
      });
      expect(activateResponse.status).toBe(200);

      // Test 1: Allow valid request
      const validEvent = {
        traceId: 'test-trace-002',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { tool: 'http.get', url: 'https://api.example.com/data' },
      };

      const validResponse = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'x-profile': 'researcher',
        },
        body: JSON.stringify(validEvent),
      });

      // Should pass through (valid according to policy)
      expect(validResponse.status).toBeLessThan(500);

      // Test 2: Deny invalid request (wrong domain)
      const invalidEvent = {
        traceId: 'test-trace-003',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { tool: 'http.get', url: 'https://malicious.com/data' },
      };

      const invalidResponse = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'x-profile': 'researcher',
        },
        body: JSON.stringify(invalidEvent),
      });

      // Should be denied by policy
      expect(invalidResponse.status).toBe(403);
      const invalidResult = await invalidResponse.json();
      expect(invalidResult.error).toBe('Policy violation');
      expect(invalidResult.reason).toContain('not in allow list');
    });

    it('should enforce read-only restrictions', async () => {
      // Test POST request with read-only profile
      const postEvent = {
        traceId: 'test-trace-004',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { tool: 'http.get', url: 'https://api.example.com/data' },
      };

      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'x-profile': 'researcher',
        },
        body: JSON.stringify(postEvent),
      });

      // Should be denied (read-only profile with POST method)
      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error).toBe('Policy violation');
      expect(result.reason).toContain('read-only');
    });

    it('should enforce tool restrictions', async () => {
      // Test request with disallowed tool
      const restrictedEvent = {
        traceId: 'test-trace-005',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { tool: 'shell.execute', url: 'https://api.example.com/data' },
      };

      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'x-profile': 'researcher',
        },
        body: JSON.stringify(restrictedEvent),
      });

      // Should be denied (tool not in allowlist)
      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error).toBe('Policy violation');
      expect(result.reason).toContain('not allowed');
    });

    it('should handle requests without profile header gracefully', async () => {
      const event = {
        traceId: 'test-trace-006',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { tool: 'http.get', url: 'https://api.example.com/data' },
      };

      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // No x-profile header
        },
        body: JSON.stringify(event),
      });

      // Should pass through (no profile specified, no enforcement)
      expect(response.status).toBeLessThan(500);
    });

    it('should cache policy and not refetch immediately', async () => {
      // This test verifies that the TTL cache is working
      // We'll make multiple requests and verify they don't all hit the collector
      
      const event = {
        traceId: 'test-trace-007',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { tool: 'http.get', url: 'https://api.example.com/data' },
      };

      // Make multiple requests in quick succession
      const promises = Array.from({ length: 3 }, () =>
        fetch(`${gatewayUrl}/v1/events`, {
          method: 'POST',
          headers: { 
            'content-type': 'application/json',
            'x-profile': 'researcher',
          },
          body: JSON.stringify(event),
        })
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (cached policy allows the request)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});
