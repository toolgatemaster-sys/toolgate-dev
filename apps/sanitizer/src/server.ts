import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');
import fastify from 'fastify';
import { z } from 'zod';
// import { defangLinks, spotlight, analyze } from '@toolgate/core';
import { metricsPlugin } from './metrics.plugin.js';

export async function createSanitizer() {
  const app = fastify({ logger: false });
  
  // Register metrics plugin
  await app.register(metricsPlugin);
  
  // Health check
  app.get('/healthz', async () => ({ 
    ok: true, 
    service: 'sanitizer' 
  }));
  
  // Root route
  app.get('/', async () => ({ ok: true, service: 'sanitizer' }));
  
  // Sanitization endpoint
  const SanitizeRequestSchema = z.object({
    text: z.string(),
    stripHtml: z.boolean().default(true),
    defang: z.boolean().default(true),
    spotlight: z.boolean().default(true)
  });
  
  app.post('/v1/sanitize-context', async (req, reply) => {
    try {
      const { text, stripHtml, defang, spotlight: spotlightEnabled } = SanitizeRequestSchema.parse(req.body);
      
      let clean = text;
      
      if (stripHtml) {
        clean = clean.replace(/<[^>]*>/g, '');
      }
      
      // Simple defanging (remove @toolgate/core dependency)
      if (defang) {
        clean = clean.replace(/https?:\/\//g, 'hxxp://');
      }
      
      // Simple risk score calculation
      const score = clean.length > 100 ? 50 : clean.includes('@') ? 30 : 10;
      
      return reply.send({
        clean,
        score,
        signals: [],
        analysis: {
          riskLevel: score > 70 ? 'high' : score > 30 ? 'medium' : 'low'
        },
        spotlighted: spotlightEnabled ? clean : undefined
      });
    } catch (err) {
      app.log.error({ err }, 'sanitize.invalid_request');
      return reply.code(400).send({ ok: false, error: 'invalid_request' });
    }
  });
  
  return app;
}
