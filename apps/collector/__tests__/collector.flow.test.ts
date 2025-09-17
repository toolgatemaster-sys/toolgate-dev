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
  });
});