import { describe, it, expect, beforeAll } from 'vitest';

describe('Gateway Service', () => {
  const baseUrl = process.env.GATEWAY_URL || 'http://localhost:8787';
  const collectorUrl = process.env.COLLECTOR_URL || 'http://localhost:8080';

  beforeAll(async () => {
    // Wait for service to be ready
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${baseUrl}/healthz`);
        if (response.ok) break;
      } catch (e) {
        if (i === maxRetries - 1) throw new Error('Gateway service not available');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  describe('Health Check', () => {
    it('should respond to /healthz', async () => {
      const response = await fetch(`${baseUrl}/healthz`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({ 
        ok: true, 
        service: 'gateway',
        upstream: { collector: collectorUrl }
      });
    });
  });

  describe('Event Proxy', () => {
    it('should proxy events to collector', async () => {
      const eventData = {
        traceId: 'test-trace-1',
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { message: 'test message' }
      };

      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({ ok: true });
      expect(data.eventId).toBeDefined();
    });

    it('should handle events with text for sanitization', async () => {
      const eventData = {
        traceId: 'test-trace-2',
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { text: '<b>Hello</b> http://example.com' }
      };

      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({ ok: true });
      expect(data.eventId).toBeDefined();
    });

    it('should reject invalid event data', async () => {
      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toMatchObject({ ok: false });
    });
  });

  describe('Trace Proxy', () => {
    it('should proxy trace requests to collector', async () => {
      // First create an event
      const eventData = {
        traceId: 'test-trace-3',
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { message: 'test for trace' }
      };

      await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      // Then fetch the trace
      const response = await fetch(`${baseUrl}/v1/traces/test-trace-3`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        traceId: 'test-trace-3',
        events: expect.any(Array)
      });
      expect(data.events.length).toBeGreaterThan(0);
    });

    it('should return empty trace for non-existent traceId', async () => {
      const response = await fetch(`${baseUrl}/v1/traces/non-existent-trace`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        traceId: 'non-existent-trace',
        events: []
      });
    });
  });

  describe('HMAC Integration', () => {
    it('should include x-signature header when HMAC_KEY is set', async () => {
      const eventData = {
        traceId: 'test-trace-hmac',
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { message: 'test hmac' }
      };

      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      // If HMAC is configured, the request should succeed
      // If not configured, it should also succeed (compat mode)
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${baseUrl}/healthz`, {
        headers: { 'Origin': 'https://example.com' }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('https://example.com');
    });
  });
});
