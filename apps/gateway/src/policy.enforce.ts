import type { FastifyInstance } from 'fastify';
import { createPolicyClient } from './policy.client.js';
import { createPolicyApplicator } from './policy.apply.js';

export async function registerEnforcement(app: FastifyInstance) {
  const COLLECTOR_URL = process.env.COLLECTOR_URL;
  if (!COLLECTOR_URL) {
    app.log.warn('No COLLECTOR_URL set, policy enforcement disabled');
    return;
  }

  const policyClient = createPolicyClient(COLLECTOR_URL, 30000);
  const policyApplicator: any = createPolicyApplicator(policyClient);

  app.addHook('preHandler', async (req, reply) => {
    // Skip enforcement for health and metrics
    if (req.url.startsWith('/healthz') || req.url.startsWith('/metrics')) {
      return;
    }
    try {
      // Build context from request
      const headers = req.headers as Record<string, any>;
      const profileHeader = headers['x-tg-profile'] || headers['x-profile'] || headers['x-user-profile'];
      const profile = typeof profileHeader === 'string' && profileHeader.trim() ? profileHeader : 'anonymous';

      const rawBody = (req as any).body;
      const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});

      // Infer tool and url from body or attrs
      const tool = body?.tool || body?.attrs?.tool || 'unknown';
      const url = body?.url || body?.attrs?.url;

      // Infer action by HTTP method
      const method = req.method;

      const evaluationRequest = {
        profile,
        action: {
          tool,
          url,
          method,
        },
        context: {
          user_id: headers['x-user-id'] as string | undefined,
          session_id: headers['x-session-id'] as string | undefined,
        },
      };

      const decision = await policyApplicator.applyPolicy(evaluationRequest);

      if (decision.decision === 'deny') {
        return reply.code(403).send({ ok: false, error: 'Policy violation', decision: 'deny', reason: decision.reason });
      }

      if (decision.decision === 'pending') {
        return reply.code(202).send({ decision: 'pending' });
      }

      // allow → continue
      (req as any).policyDecision = decision;
    } catch (err) {
      app.log.error({ err }, 'gateway.policy.enforcement_failed');
      return reply.code(500).send({ ok: false, error: 'policy_enforcement_failed' });
    }
  });
}
