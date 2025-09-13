import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { z } from 'zod';
import { defangLinks, spotlight, analyze } from '@toolgate/core';

const PORT = 8786;

// Schema validation
const SanitizeRequestSchema = z.object({
  text: z.string(),
  stripHtml: z.boolean().default(false),
  defang: z.boolean().default(true),
  spotlight: z.boolean().default(true),
});

const fastify = Fastify({
  logger: true,
});

// Detection patterns
const DETECTORS = {
  ignore_previous: /ignore\s+(previous|all\s+previous)\s+(instructions?|commands?|prompts?)/gi,
  developer_mode: /(developer|debug|admin|test)\s+mode/gi,
  hidden_html: /<[^>]+style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>.*?<\/[^>]+>/gis,
  suspicious_links: /https?:\/\/[^\s]+\.(exe|zip|rar|7z|scr|bat|cmd|ps1|sh|bash)/gi,
  data_extraction: /extract|download|export|dump|backup|copy\s+(all|entire)/gi,
  system_access: /(sudo|admin|root|system|registry|config|settings)/gi,
};

// Risk scoring
function calculateRiskScore(signals: string[]): number {
  const weights: Record<string, number> = {
    ignore_previous: 80,
    developer_mode: 70,
    hidden_html: 60,
    suspicious_links: 75,
    data_extraction: 65,
    system_access: 50,
  };
  
  let score = 0;
  signals.forEach(signal => {
    score += weights[signal] || 10;
  });
  
  return Math.min(score, 100);
}

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'sanitizer' };
});

// POST /v1/sanitize-context - Sanitize text content
fastify.post('/v1/sanitize-context', async (request, reply) => {
  try {
    const { text, stripHtml, defang, spotlight: enableSpotlight } = SanitizeRequestSchema.parse(request.body);
    
    let cleanText = text;
    const signals: string[] = [];
    
    // Strip HTML if requested
    if (stripHtml) {
      cleanText = cleanText.replace(/<[^>]*>/g, '');
    }
    
    // Run detectors
    Object.entries(DETECTORS).forEach(([name, pattern]) => {
      if (pattern.test(text)) {
        signals.push(name);
      }
    });
    
    // Defang links if requested
    if (defang) {
      cleanText = defangLinks(cleanText);
    }
    
    // Apply spotlight if requested
    let spotlighted = '';
    if (enableSpotlight) {
      spotlighted = spotlight("user", cleanText);
    }
    
    // Calculate risk score
    const score = calculateRiskScore(signals);
    
    // Run analysis
    const analysis = analyze(cleanText);
    
    return {
      clean: cleanText,
      spotlighted: enableSpotlight ? spotlighted : undefined,
      score,
      signals,
      analysis: {
        ...analysis,
        riskLevel: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
      },
    };
    
  } catch (error) {
    fastify.log.error(error);
    
    if (error instanceof z.ZodError) {
      reply.code(400);
      return { error: 'Validation error', details: error.errors };
    }
    
    reply.code(500);
    return { error: 'Internal server error' };
  }
});

// Start server
const start = async () => {
  try {
    // Register CORS
    await fastify.register(fastifyCors as any, {
      origin: true,
      methods: ["GET","POST","PUT","DELETE","OPTIONS"],
      credentials: true,
    });
    
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Sanitizer service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
