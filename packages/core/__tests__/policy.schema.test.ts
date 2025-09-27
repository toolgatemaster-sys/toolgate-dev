import { describe, it, expect } from 'vitest';
import { validatePolicy, validatePolicyEvaluationRequest, Policy } from '../src/policy.schema';

describe('Policy Schema Validation', () => {
  describe('validatePolicy', () => {
    it('should validate a valid policy', () => {
      const validPolicy = {
        version: 1,
        profiles: {
          researcher: {
            read_only: true,
            tools: ['http.get', 'vector.search'],
            domains_allow: ['api.example.com'],
            budgets: {
              rpm: 60,
            },
          },
        },
        defaults: {
          approvals_ttl_seconds: 3600,
          default_profile: 'researcher',
        },
      };

      expect(() => validatePolicy(validPolicy)).not.toThrow();
      const result = validatePolicy(validPolicy);
      expect(result.version).toBe(1);
      expect(result.profiles.researcher.read_only).toBe(true);
    });

    it('should reject invalid policy version', () => {
      const invalidPolicy = {
        version: '1', // string instead of number
        profiles: {},
        defaults: { approvals_ttl_seconds: 3600 },
      };

      expect(() => validatePolicy(invalidPolicy)).toThrow('Policy version must be a positive number');
    });

    it('should reject policy with negative version', () => {
      const invalidPolicy = {
        version: -1,
        profiles: {},
        defaults: { approvals_ttl_seconds: 3600 },
      };

      expect(() => validatePolicy(invalidPolicy)).toThrow('Policy version must be a positive number');
    });

    it('should reject policy without profiles', () => {
      const invalidPolicy = {
        version: 1,
        defaults: { approvals_ttl_seconds: 3600 },
      };

      expect(() => validatePolicy(invalidPolicy)).toThrow('Policy must have profiles object');
    });

    it('should reject policy without defaults', () => {
      const invalidPolicy = {
        version: 1,
        profiles: {},
      };

      expect(() => validatePolicy(invalidPolicy)).toThrow('Policy must have defaults object');
    });

    it('should reject invalid profile tools', () => {
      const invalidPolicy = {
        version: 1,
        profiles: {
          researcher: {
            tools: 'http.get', // string instead of array
          },
        },
        defaults: { approvals_ttl_seconds: 3600 },
      };

      expect(() => validatePolicy(invalidPolicy)).toThrow('Profile tools must be an array');
    });

    it('should reject invalid budgets', () => {
      const invalidPolicy = {
        version: 1,
        profiles: {
          researcher: {
            budgets: {
              rpm: '60', // string instead of number
            },
          },
        },
        defaults: { approvals_ttl_seconds: 3600 },
      };

      expect(() => validatePolicy(invalidPolicy)).toThrow('Budget rpm must be a positive number');
    });
  });

  describe('validatePolicyEvaluationRequest', () => {
    it('should validate a valid request', () => {
      const validRequest = {
        profile: 'researcher',
        action: {
          tool: 'http.get',
          url: 'https://api.example.com/data',
          method: 'GET',
        },
        context: {
          user_id: 'user123',
          session_id: 'session456',
        },
      };

      expect(() => validatePolicyEvaluationRequest(validRequest)).not.toThrow();
      const result = validatePolicyEvaluationRequest(validRequest);
      expect(result.profile).toBe('researcher');
      expect(result.action.tool).toBe('http.get');
    });

    it('should reject request without profile', () => {
      const invalidRequest = {
        action: {
          tool: 'http.get',
        },
      };

      expect(() => validatePolicyEvaluationRequest(invalidRequest)).toThrow('Request profile must be a non-empty string');
    });

    it('should reject request without action', () => {
      const invalidRequest = {
        profile: 'researcher',
      };

      expect(() => validatePolicyEvaluationRequest(invalidRequest)).toThrow('Request must have action object');
    });

    it('should reject request without tool', () => {
      const invalidRequest = {
        profile: 'researcher',
        action: {},
      };

      expect(() => validatePolicyEvaluationRequest(invalidRequest)).toThrow('Action tool must be a non-empty string');
    });

    it('should reject non-object request', () => {
      expect(() => validatePolicyEvaluationRequest('invalid')).toThrow('Policy evaluation request must be an object');
    });
  });
});


