import { Policy, PolicyEvaluationRequest, PolicyEvaluationResult } from '../../../packages/core/dist/policy.schema.js';
import { evaluate } from '../../../packages/core/dist/policy.evaluate.js';
import { PolicyClient } from './policy.client.js';

export interface PolicyApplicator {
  applyPolicy(request: PolicyEvaluationRequest): Promise<PolicyEvaluationResult>;
  getActivePolicy(): Promise<Policy | null>;
}

export class GatewayPolicyApplicator implements PolicyApplicator {
  constructor(private policyClient: PolicyClient) {}

  async applyPolicy(request: PolicyEvaluationRequest): Promise<PolicyEvaluationResult> {
    try {
      // Get active policy from cache
      const policy = await this.policyClient.getActivePolicy();
      
      if (!policy) {
        // No active policy - default to deny for safety
        return {
          decision: 'deny',
          reason: 'No active policy found',
          profile_applied: request.profile,
        };
      }

      // Evaluate the policy
      return evaluate(policy, request);
    } catch (error) {
      console.error('Error applying policy:', error);
      
      // On error, default to deny for safety
      return {
        decision: 'deny',
        reason: 'Policy evaluation error',
        profile_applied: request.profile,
      };
    }
  }

  async getActivePolicy(): Promise<Policy | null> {
    return this.policyClient.getActivePolicy();
  }

  /**
   * Check if policy enforcement should be applied based on request context
   */
  shouldEnforcePolicy(request: PolicyEvaluationRequest): boolean {
    // Always enforce policy for now - could be made configurable
    return true;
  }

  /**
   * Extract policy evaluation request from HTTP request
   */
  extractPolicyRequest(req: any): PolicyEvaluationRequest | null {
    try {
      // Extract from request headers and body
      const profile = req.headers['x-profile'] || req.headers['x-user-profile'] || 'default';
      const method = req.method;
      
      // Try to extract tool and URL from request
      let tool = 'unknown';
      let url: string | undefined;

      if (req.body && typeof req.body === 'object') {
        // Check if it's a tool invocation request
        if (req.body.tool) {
          tool = req.body.tool;
        } else if (req.body.attrs && req.body.attrs.tool) {
          tool = req.body.attrs.tool;
        }
        if (req.body.url) {
          url = req.body.url;
        } else if (req.body.attrs && req.body.attrs.url) {
          url = req.body.attrs.url;
        }
      }

      // Fallback: Extract from URL path if it's a tool request
      const pathParts = req.url.split('/');
      if (pathParts.length > 2 && pathParts[1] === 'v1' && tool === 'unknown') {
        tool = pathParts[2]; // e.g., /v1/events -> 'events'
      }

      return {
        profile,
        action: {
          tool,
          url,
          method,
        },
        context: {
          user_id: req.headers['x-user-id'],
          session_id: req.headers['x-session-id'],
        },
      };
    } catch (error) {
      console.error('Error extracting policy request:', error);
      return null;
    }
  }
}

// Factory function
export function createPolicyApplicator(policyClient: PolicyClient): PolicyApplicator {
  return new GatewayPolicyApplicator(policyClient);
}