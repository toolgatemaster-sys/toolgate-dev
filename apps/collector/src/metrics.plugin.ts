import { FastifyInstance } from 'fastify';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Clear default metrics for cleaner output
register.clear();

// Create custom metrics for collector
const httpRequestsTotal = new Counter({
  name: 'collector_http_requests_total',
  help: 'Total number of HTTP requests to collector',
  labelNames: ['method', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'collector_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Collect default metrics (optional, but useful)
collectDefaultMetrics();

export async function metricsPlugin(fastify: FastifyInstance) {
  // Add metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    try {
      const metrics = await register.metrics();
      reply.type('text/plain; version=0.0.4; charset=utf-8');
      return metrics;
    } catch (error) {
      fastify.log.error(error, 'Failed to collect metrics');
      reply.code(500);
      return 'Error collecting metrics';
    }
  });

  // Add request hooks to track metrics
  fastify.addHook('onResponse', async (request, reply) => {
    const method = request.method;
    const status = reply.statusCode.toString();

    httpRequestsTotal.inc({ method, status });
    httpRequestDuration.observe({ method, status }, 0.1); // Simple duration for now
  });
}

// Export metrics for testing
export { httpRequestsTotal, httpRequestDuration };