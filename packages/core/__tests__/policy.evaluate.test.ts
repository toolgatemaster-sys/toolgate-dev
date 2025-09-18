import { describe, it, expect } from 'vitest';
import { evaluate, Policy } from '../dist/policy.evaluate.js';

describe('Policy Evaluation', () => {
  const samplePolicy: Policy = {
    version: 1,
    profiles: {
      researcher: {
        read_only: true,
        tools: ['http.get', 'vector.search'],
        domains_allow: ['api.example.com'],
        domains_deny: ['malicious.com'],
        budgets: {
          rpm: 60,
        },
      },
      admin: {
        read_only: false,
        tools: ['http.get', 'shell.execute'],
        domains_allow: ['*'],
      },
    },
    defaults: {
      approvals_ttl_seconds: 3600,
      default_profile: 'researcher',
    },
  };

  describe('evaluate', () => {
    it('should allow valid request for researcher profile', () => {
      const request = {
        profile: 'researcher',
        action: {
          tool: 'http.get',
          url: 'https://api.example.com/data',
          method: 'GET',
        },
        context: {
          user_id: 'user123',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('allow');
      expect(result.profile_applied).toBe('researcher');
      expect(result.reason).toBe('Request allowed by profile rules');
    });

    it('should deny request for non-existent profile', () => {
      const request = {
        profile: 'nonexistent',
        action: {
          tool: 'http.get',
          method: 'GET',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('deny');
      expect(result.reason).toBe("Profile 'nonexistent' not found");
    });

    it('should deny POST request for read-only profile', () => {
      const request = {
        profile: 'researcher',
        action: {
          tool: 'http.get',
          url: 'https://api.example.com/data',
          method: 'POST',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('deny');
      expect(result.reason).toBe('Profile is read-only, only GET requests allowed');
    });

    it('should allow POST request for non-read-only profile', () => {
      const request = {
        profile: 'admin',
        action: {
          tool: 'http.get',
          url: 'https://api.example.com/data',
          method: 'POST',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('allow');
      expect(result.profile_applied).toBe('admin');
    });

    it('should deny request for tool not in allowlist', () => {
      const request = {
        profile: 'researcher',
        action: {
          tool: 'shell.execute',
          method: 'GET',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('deny');
      expect(result.reason).toBe("Tool 'shell.execute' not allowed for this profile");
    });

    it('should deny request for domain in deny list', () => {
      const request = {
        profile: 'researcher',
        action: {
          tool: 'http.get',
          url: 'https://malicious.com/evil',
          method: 'GET',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('deny');
      expect(result.reason).toBe("Domain 'malicious.com' is in deny list");
    });

    it('should deny request for domain not in allow list', () => {
      const request = {
        profile: 'researcher',
        action: {
          tool: 'http.get',
          url: 'https://other-site.com/data',
          method: 'GET',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('deny');
      expect(result.reason).toBe("Domain 'other-site.com' not in allow list");
    });

    it('should allow request without domain restrictions for admin', () => {
      const request = {
        profile: 'admin',
        action: {
          tool: 'http.get',
          url: 'https://any-domain.com/data',
          method: 'GET',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('allow');
      expect(result.profile_applied).toBe('admin');
    });

    it('should flag high-risk tools for approval', () => {
      const request = {
        profile: 'admin',
        action: {
          tool: 'shell.execute',
          method: 'POST',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('allow');
      expect(result.constraints?.requires_approval).toBe(true);
    });

    it('should flag high-risk domains for approval', () => {
      const request = {
        profile: 'admin',
        action: {
          tool: 'http.get',
          url: 'https://internal.server/admin',
          method: 'GET',
        },
      };

      const result = evaluate(samplePolicy, request);
      expect(result.decision).toBe('allow');
      expect(result.constraints?.requires_approval).toBe(true);
    });
  });
});
