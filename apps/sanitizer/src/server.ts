import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');
import fastify from 'fastify';
import { z } from 'zod';
import { defangLinks, spotlight, analyze } from '@toolgate/core';

export async function createSanitizer() {
  const app = fastify({ logger: false });
  
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
      
      if (defang) {
        clean = defangLinks(clean);
      }
      
      if (spotlightEnabled) {
        clean = spotlight('user', clean);
      }
      
      const analysis = analyze(clean);
      
      return reply.send({
        clean,
        score: analysis.score,
        signals: analysis.signals,
        analysis: {
          riskLevel: analysis.score > 70 ? 'high' : analysis.score > 30 ? 'medium' : 'low'
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
