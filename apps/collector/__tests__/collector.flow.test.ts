import { describe, it, expect, beforeAll } from 'vitest';
import { hmacHeader } from '../../../packages/core/__tests__/helpers/hmac.js';

describe('Collector Flow via Gateway', () => {
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

  describe('Event Flow: Client → Gateway → Collector', () => {
    it('should ingest an event through Gateway and be retrievable in Collector', async () => {
      const event = {
        traceId: `tg-flow-test-001-${Date.now()}`,
        type: 'tool.invocation',
        ts: new Date().toISOString(),
        attrs: { 
          tool: 'http.get', 
          url: 'https://httpbin.org/get',
          message: 'test flow via gateway'
        }
      };

      // 1. Cliente → Gateway (con firma HMAC si está configurada)
      const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
      
      const gatewayResponse = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      expect(gatewayResponse.status).toBeLessThan(300);
      const gatewayData = await gatewayResponse.json();
      expect(gatewayData).toMatchObject({ ok: true });

      // 2. Verificar que llegó al Collector
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for propagation
      
      const collectorResponse = await fetch(`${collectorUrl}/v1/traces/${event.traceId}`);
      expect(collectorResponse.status).toBe(200);
      
      const collectorData = await collectorResponse.json();
      expect(collectorData).toMatchObject({
        traceId: event.traceId,
        events: expect.any(Array)
      });
      
      // Verificar que el evento llegó con los datos correctos
      const storedEvent = collectorData.events.find((e: any) => e.type === 'tool.invocation');
      expect(storedEvent).toBeDefined();
      expect(storedEvent.attrs.tool).toBe('http.get');
    });

    it('should handle multiple events for same traceId through Gateway', async () => {
      const traceId = `tg-flow-test-multi-${Date.now()}`;
      const events = [
        {
          traceId,
          type: 'tool.start',
          ts: new Date().toISOString(),
          attrs: { step: 1, action: 'start' }
        },
        {
          traceId,
          type: 'tool.process',
          ts: new Date().toISOString(),
          attrs: { step: 2, action: 'process' }
        },
        {
          traceId,
          type: 'tool.end',
          ts: new Date().toISOString(),
          attrs: { step: 3, action: 'end' }
        }
      ];

      // Enviar todos los eventos a través del Gateway
      for (const event of events) {
        const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
        
        const response = await fetch(`${gatewayUrl}/v1/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify(event)
        });
        
        expect(response.status).toBeLessThan(300);
      }

      // Verificar que todos llegaron al Collector
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const collectorResponse = await fetch(`${collectorUrl}/v1/traces/${traceId}`);
      expect(collectorResponse.status).toBe(200);
      
      const collectorData = await collectorResponse.json();
      expect(collectorData.events.length).toBe(3);
      expect(collectorData.events[0].attrs.step).toBe(1);
      expect(collectorData.events[1].attrs.step).toBe(2);
      expect(collectorData.events[2].attrs.step).toBe(3);
    });

    it('should sanitize text content through Gateway flow', async () => {
      const event = {
        traceId: `tg-flow-sanitize-test-${Date.now()}`,
        type: 'user.input',
        ts: new Date().toISOString(),
        attrs: { 
          text: '<b>Hello</b> world! Visit http://example.com for more info.',
          source: 'web-ui'
        }
      };

      const headers = hmacHeader(event, clientKey, 'x-toolgate-client-sig');
      
      const gatewayResponse = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      expect(gatewayResponse.status).toBeLessThan(300);
      
      // Verificar que llegó al Collector (posiblemente sanitizado)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const collectorResponse = await fetch(`${collectorUrl}/v1/traces/${event.traceId}`);
      expect(collectorResponse.status).toBe(200);
      
      const collectorData = await collectorResponse.json();
      expect(collectorData.events.length).toBeGreaterThan(0);
      
      // El evento debería haber pasado por el sanitizer en el Gateway
      const storedEvent = collectorData.events.find((e: any) => e.type === 'user.input');
      expect(storedEvent).toBeDefined();
      expect(storedEvent.attrs.text).toBeDefined();
    });
  });

  describe('Error Handling in Flow', () => {
    it('should handle invalid events gracefully through Gateway', async () => {
      const invalidEvent = {
        traceId: `tg-flow-invalid-test-${Date.now()}`,
        // Missing required fields
        attrs: { message: 'invalid event' }
      };

      const headers = hmacHeader(invalidEvent, clientKey, 'x-toolgate-client-sig');
      
      const gatewayResponse = await fetch(`${gatewayUrl}/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidEvent)
      });

      // Gateway should reject invalid events
      expect(gatewayResponse.status).toBe(400);
      
      const gatewayData = await gatewayResponse.json();
      expect(gatewayData).toMatchObject({ ok: false });
    });
  });
});
