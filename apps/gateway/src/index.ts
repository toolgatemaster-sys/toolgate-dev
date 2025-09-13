import Fastify from 'fastify';
import cors from '@fastify/cors';
import { request as undiciRequest } from 'undici';
import { z } from 'zod';
import { hmacSign } from '../../../packages/core/dist/index.js';

const PORT = 8787;

// Schema validation
const ProxyRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: z.string().url(),
  headers: z.record(z.string()).default({}),
  body: z.string().optional(),
  traceId: z.string(),
});

const fastify = Fastify({
  logger: true,
});

// CORS
fastify.register(cors, {
  origin: true,
});

// Helper functions
function isHostAllowed(url: string, allowedHosts: string[]): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    return allowedHosts.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(hostname);
      }
      return hostname === allowed || hostname.endsWith(`.${allowed}`);
    });
  } catch {
    return false;
  }
}

async function emitEvent(
  collectorUrl: string,
  event: {
    traceId: string;
    type: string;
    ts: string;
    attrs: Record<string, any>;
  }
) {
  try {
    await undiciRequest(`${collectorUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    fastify.log.error(`Failed to emit event to collector: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'gateway' };
});

// POST /v1/proxy - Proxy requests with HMAC signing
fastify.post('/v1/proxy', async (request, reply) => {
  const startTime = Date.now();
  
  try {
    const proxyData = ProxyRequestSchema.parse(request.body);
    const { method, url, headers, body, traceId } = proxyData;
    
    // Check host allowlist
    const allowedHosts = (process.env.ALLOW_HOSTS || '').split(',').map(h => h.trim());
    
    if (!isHostAllowed(url, allowedHosts)) {
      const latencyMs = Date.now() - startTime;
      
      // Emit deny event
      await emitEvent(process.env.TOOLGATE_COLLECTOR_URL || 'http://localhost:8785', {
        traceId,
        type: 'gateway.decision',
        ts: new Date().toISOString(),
        attrs: {
          url,
          method,
          decision: 'deny',
          reason: 'host_not_allowed',
          allowedHosts,
          latencyMs,
        },
      });
      
      reply.code(403);
      return {
        error: 'Host not allowed',
        url,
        allowedHosts,
      };
    }
    
    // Create HMAC signature
    const ts = Date.now().toString();
    const signature = await hmacSign(
      process.env.HMAC_KEY || 'dev_secret',
      `${method} ${url} ${traceId} ${ts}`
    );
    
    // Prepare request headers
    const proxyHeaders = {
      ...headers,
      'x-toolgate-sig': signature,
      'x-toolgate-trace': traceId,
      'x-toolgate-ts': ts,
    };
    
    // Make proxy request
    const proxyResponse = await undiciRequest(url as string, {
      method,
      headers: proxyHeaders,
      body: body || undefined,
    });
    
    const responseBody = await proxyResponse.body.text();
    const latencyMs = Date.now() - startTime;
    
    // Emit allow event
    await emitEvent(process.env.TOOLGATE_COLLECTOR_URL || 'http://localhost:8785', {
      traceId,
      type: 'gateway.decision',
      ts: new Date().toISOString(),
      attrs: {
        url,
        method,
        decision: 'allow',
        status: proxyResponse.statusCode,
        latencyMs,
      },
    });
    
    // Return proxy response
    reply.code(proxyResponse.statusCode);
    reply.headers(proxyResponse.headers as Record<string, string>);
    return responseBody;
    
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    fastify.log.error(error);
    
    if (error instanceof z.ZodError) {
      reply.code(400);
      return { error: 'Validation error', details: error.errors };
    }
    
    // Emit error event
    await emitEvent(process.env.TOOLGATE_COLLECTOR_URL || 'http://localhost:8785', {
      traceId: (request.body as any)?.traceId || 'unknown',
      type: 'gateway.error',
      ts: new Date().toISOString(),
      attrs: {
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs,
      },
    });
    
    reply.code(500);
    return { error: 'Internal server error' };
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Gateway service running on port ${PORT}`);
    fastify.log.info(`Allowed hosts: ${process.env.ALLOW_HOSTS || 'none configured'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
