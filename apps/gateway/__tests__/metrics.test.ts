import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createGateway } from '../src/server';

describe('Gateway Metrics', () => {
  let app: any;
  let baseUrl: string;

  beforeAll(async () => {
    app = await createGateway();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should expose /metrics endpoint with 200 status', async () => {
    const response = await fetch(`${baseUrl}/metrics`);
    expect(response.status).toBe(200);
  });

  it('should return metrics in Prometheus format', async () => {
    const response = await fetch(`${baseUrl}/metrics`);
    const text = await response.text();
    
    expect(response.headers.get('content-type')).toBe('text/plain; version=0.0.4; charset=utf-8');
    expect(text).toContain('gateway_http_requests_total');
  });

  it('should track metrics for requests', async () => {
    // Make a request to generate metrics
    await fetch(`${baseUrl}/healthz`);
    
    const response = await fetch(`${baseUrl}/metrics`);
    const text = await response.text();
    
    expect(text).toContain('gateway_http_requests_total');
    expect(text).toContain('gateway_http_request_duration_seconds');
  });
});