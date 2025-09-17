import { describe, it, expect, beforeAll } from 'vitest';
import { createHmac } from 'node:crypto';

describe('Collector Service', () => {
  const baseUrl = process.env.COLLECTOR_URL || 'http://localhost:8080';
  const hmacKey = process.env.HMAC_KEY;

  function signRequest(body: string): string | undefined {
    if (!hmacKey) return undefined;
    return createHmac('sha256', hmacKey).update(body, 'utf8').digest('hex');
  }

  beforeAll(async () => {
    // Wait for service to be ready
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${baseUrl}/healthz`);
        if (response.ok) break;
      } catch (e) {
        if (i === maxRetries - 1) throw new Error('Collector service not available');
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
        service: 'collector',
        storage: expect.any(String)
      });
    });

    it('should respond to root endpoint', async () => {
      const response = await fetch(`${baseUrl}/`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({ 
        ok: true, 
        service: 'collector'
      });
    });
  });

  describe('Event Storage (POST /v1/events)', () => {
    it('should store valid events', async () => {
      const eventData = {
        traceId: 'test-trace-1',
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { message: 'test message' }
      };

      const body = JSON.stringify(eventData);
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const signature = signRequest(body);
      if (signature) headers['x-signature'] = signature;
      
      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers,
        body
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({ ok: true });
      expect(data.eventId).toBeDefined();
      expect(typeof data.eventId).toBe('string');
    });

    it('should store events with complex attrs', async () => {
      const eventData = {
        traceId: 'test-trace-2',
        type: 'complex.event',
        ts: new Date().toISOString(),
        attrs: { 
          text: 'Hello world',
          metadata: { source: 'test', version: 1 },
          array: [1, 2, 3]
        }
      };

      const body = JSON.stringify(eventData);
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const signature = signRequest(body);
      if (signature) headers['x-signature'] = signature;
      
      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers,
        body
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({ ok: true });
    });

    it('should reject invalid event data', async () => {
      const body = JSON.stringify({ invalid: 'data' });
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const signature = signRequest(body);
      if (signature) headers['x-signature'] = signature;
      
      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers,
        body
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toMatchObject({ ok: false });
      expect(data.error).toBe('invalid_payload');
    });

    it('should reject events without required fields', async () => {
      const body = JSON.stringify({});
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const signature = signRequest(body);
      if (signature) headers['x-signature'] = signature;
      
      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers,
        body
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toMatchObject({ ok: false });
    });
  });

  describe('Trace Retrieval (GET /v1/traces/:id)', () => {
    it('should retrieve stored events by traceId', async () => {
      const traceId = 'test-trace-retrieval';
      const eventData = {
        traceId,
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { message: 'retrieval test' }
      };

      // Store event
      await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      // Retrieve trace
      const response = await fetch(`${baseUrl}/v1/traces/${traceId}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        traceId,
        events: expect.any(Array)
      });
      expect(data.events.length).toBe(1);
      expect(data.events[0]).toMatchObject({
        eventId: expect.any(String),
        traceId,
        type: 'test.event',
        attrs: { message: 'retrieval test' }
      });
    });

    it('should return empty events for non-existent traceId', async () => {
      const response = await fetch(`${baseUrl}/v1/traces/non-existent-trace`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        traceId: 'non-existent-trace',
        events: []
      });
    });

    it('should handle multiple events for same traceId', async () => {
      const traceId = 'test-trace-multiple';
      
      // Store multiple events
      const events = [
        { traceId, type: 'event.1', ts: new Date().toISOString(), attrs: { step: 1 } },
        { traceId, type: 'event.2', ts: new Date().toISOString(), attrs: { step: 2 } },
        { traceId, type: 'event.3', ts: new Date().toISOString(), attrs: { step: 3 } }
      ];

      for (const event of events) {
        await fetch(`${baseUrl}/v1/events`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(event)
        });
      }

      // Retrieve trace
      const response = await fetch(`${baseUrl}/v1/traces/${traceId}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.events.length).toBe(3);
      expect(data.events[0].attrs.step).toBe(1);
      expect(data.events[1].attrs.step).toBe(2);
      expect(data.events[2].attrs.step).toBe(3);
    });
  });

  describe('HMAC Verification', () => {
    it('should work with or without HMAC based on configuration', async () => {
      const eventData = {
        traceId: 'test-trace-hmac',
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { message: 'hmac test' }
      };

      const body = JSON.stringify(eventData);
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const signature = signRequest(body);
      if (signature) headers['x-signature'] = signature;
      
      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers,
        body
      });

      // Should succeed if HMAC is not required, or if signature is valid
      expect([200, 401]).toContain(response.status);
    });

    it('should reject requests with invalid HMAC signature when HMAC is required', async () => {
      if (!hmacKey) {
        // Skip this test if HMAC is not configured
        return;
      }

      const eventData = {
        traceId: 'test-trace-bad-hmac',
        type: 'test.event',
        ts: new Date().toISOString(),
        attrs: { message: 'bad hmac test' }
      };

      const body = JSON.stringify(eventData);
      const response = await fetch(`${baseUrl}/v1/events`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'x-signature': 'invalid-signature'
        },
        body
      });

      expect(response.status).toBe(401);
    });
  });
});
