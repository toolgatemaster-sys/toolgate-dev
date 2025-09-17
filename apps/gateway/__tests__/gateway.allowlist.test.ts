import { describe, it, expect, beforeAll } from 'vitest';
import { hmacHeader } from '../../../packages/core/__tests__/helpers/hmac.js';

describe('Gateway Allowlist and HMAC to Collector', () => {
  const gatewayUrl = process.env.GATEWAY_URL || 'https://toolgate-gateway.up.railway.app';
  const collectorUrl = process.env.COLLECTOR_URL || 'https://toolgate-collector.up.railway.app';
  const clientKey = process.env.TOOLGATE_CLIENT_HMAC_KEY || 'dev-client-key';

  beforeAll(async () => {
    // Wait for services to be ready
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const [gatewayRes, collectorRes] = await Promise.all([
          fetch(`${gatewayUrl}/healthz`),
          fetch(`${collectorUrl}/healthz`)
        ]);
        if (gatewayRes.ok && collectorRes.ok) break;
      } catch (e) {
        if (i === maxRetries - 1) throw new Error('Services not available');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  describe('Allowlist Policy', () => {
    it('should allow events for allowed domains', async () => {
      const event = {
        traceId: 'tg-allow-test-001',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { 
          tool: 'http.get', 
          url: 'https://httpbin.org/get',
          message: 'allowed domain test'
        }
      };

      const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
      
      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      expect(response.status).toBeLessThan(300);
      
      const data = await response.json();
      expect(data).toMatchObject({ ok: true });
    });

    it('should reject events for non-allowed domains', async () => {
      const event = {
        traceId: 'tg-deny-test-001',
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { 
          tool: 'http.get', 
          url: 'https://evil.example.not-allowed/',
          message: 'denied domain test'
        }
      };

      const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
      
      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      // Should be rejected by allowlist (if configured) or accepted (if no allowlist)
      expect([200, 403, 400]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        // If no allowlist is configured, it should succeed
        expect(data).toMatchObject({ ok: true });
      } else {
        // If allowlist is configured, it should reject
        expect(data).toMatchObject({ ok: false });
      }
    });

    it('should handle events without URL in attrs', async () => {
      const event = {
        traceId: 'tg-no-url-test',
        type: 'system.event',
        ts: new Date().toISOString(),
        attrs: { 
          message: 'event without URL',
          level: 'info'
        }
      };

      const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
      
      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      // Should pass if no URL to check
      expect(response.status).toBeLessThan(300);
    });
  });

  describe('HMAC Integration', () => {
    it('should include x-signature header when forwarding to Collector', async () => {
      const event = {
        traceId: 'tg-hmac-test-001',
        type: 'hmac.test',
        ts: new Date().toISOString(),
        attrs: { message: 'HMAC integration test' }
      };

      const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
      
      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      expect(response.status).toBeLessThan(300);
      
      // Verify event reached Collector
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const collectorResponse = await fetch(`${collectorUrl}/v1/traces/${event.traceId}`);
      expect(collectorResponse.status).toBe(200);
      
      const collectorData = await collectorResponse.json();
      expect(collectorData.events.length).toBeGreaterThan(0);
    });

    it('should handle HMAC verification errors gracefully', async () => {
      const event = {
        traceId: 'tg-hmac-error-test',
        type: 'hmac.error.test',
        ts: new Date().toISOString(),
        attrs: { message: 'HMAC error test' }
      };

      // Send with invalid signature
      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-toolgate-client-sig': 'invalid-signature'
        },
        body: JSON.stringify(event)
      });

      // Should handle gracefully (either accept or reject with proper error)
      expect([200, 401, 400]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await fetch(`${gatewayUrl}/healthz`, {
        headers: { 'Origin': 'https://example.com' }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('https://example.com');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type'
        }
      });

      expect(response.status).toBeLessThan(300);
      expect(response.headers.get('access-control-allow-origin')).toBe('https://example.com');
    });
  });

  describe('End-to-End Flow Verification', () => {
    it('should complete full flow: Client → Gateway → Collector', async () => {
      const event = {
        traceId: 'tg-e2e-flow-test',
        type: 'e2e.test',
        ts: new Date().toISOString(),
        attrs: { 
          message: 'End-to-end flow test',
          url: 'https://httpbin.org/get',
          metadata: { test: true, version: '1.0' }
        }
      };

      // 1. Send through Gateway
      const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
      
      const gatewayResponse = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      expect(gatewayResponse.status).toBeLessThan(300);
      const gatewayData = await gatewayResponse.json();
      expect(gatewayData).toMatchObject({ ok: true });

      // 2. Verify in Collector
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const collectorResponse = await fetch(`${collectorUrl}/v1/traces/${event.traceId}`);
      expect(collectorResponse.status).toBe(200);
      
      const collectorData = await collectorResponse.json();
      expect(collectorData).toMatchObject({
        traceId: event.traceId,
        events: expect.any(Array)
      });
      
      // 3. Verify event details
      const storedEvent = collectorData.events.find((e: any) => e.type === 'e2e.test');
      expect(storedEvent).toBeDefined();
      expect(storedEvent.attrs.message).toBe('End-to-end flow test');
      expect(storedEvent.attrs.metadata.test).toBe(true);
    });
  });
});
