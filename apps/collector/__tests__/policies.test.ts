import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createCollector } from '../src/server.js';

describe('Collector Policy Endpoints', () => {
  let app: any;
  let baseUrl: string;

  beforeAll(async () => {
    app = await createCollector();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/policies/publish', () => {
    it('should publish a valid policy', async () => {
      const policyYaml = `version: 1
profiles:
  researcher:
    read_only: true
    tools: [http.get, vector.search]
    domains_allow: [api.example.com]
    budgets:
      rpm: 60
defaults:
  approvals_ttl_seconds: 3600`;

      const response = await fetch(`${baseUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ yaml: policyYaml }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.ok).toBe(true);
      expect(result.version).toBeDefined();
      expect(result.version.id).toBeDefined();
      expect(result.version.version).toBe(1);
      expect(result.version.is_active).toBe(false);
    });

    it('should publish a policy object directly', async () => {
      const policy = {
        version: 1,
        profiles: {
          admin: {
            read_only: false,
            tools: ['http.get', 'shell.execute'],
            domains_allow: ['*'],
          },
        },
        defaults: {
          approvals_ttl_seconds: 1800,
        },
      };

      const response = await fetch(`${baseUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ policy }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.ok).toBe(true);
      expect(result.version.version).toBe(1);
    });

    it('should reject invalid policy', async () => {
      const invalidPolicy = {
        version: 'invalid',
        profiles: {},
        defaults: { approvals_ttl_seconds: 3600 },
      };

      const response = await fetch(`${baseUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ policy: invalidPolicy }),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Invalid policy');
    });

    it('should reject request without yaml or policy', async () => {
      const response = await fetch(`${baseUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Missing yaml or policy field');
    });
  });

  describe('GET /v1/policies/active', () => {
    it('should return null when no active policy', async () => {
      const response = await fetch(`${baseUrl}/v1/policies/active`);
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.ok).toBe(true);
      expect(result.active).toBe(null);
    });

    it('should return active policy after activation', async () => {
      // First publish a policy
      const policy = {
        version: 1,
        profiles: {
          test: {
            read_only: true,
            tools: ['http.get'],
          },
        },
        defaults: { approvals_ttl_seconds: 3600 },
      };

      const publishResponse = await fetch(`${baseUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ policy }),
      });

      const publishResult = await publishResponse.json();
      const versionId = publishResult.version.id;

      // Activate the policy
      const activateResponse = await fetch(`${baseUrl}/v1/policies/activate/${versionId}`, {
        method: 'POST',
      });

      expect(activateResponse.status).toBe(200);

      // Check active policy
      const activeResponse = await fetch(`${baseUrl}/v1/policies/active`);
      expect(activeResponse.status).toBe(200);
      const activeResult = await activeResponse.json();
      expect(activeResult.ok).toBe(true);
      expect(activeResult.active).toBeDefined();
      expect(activeResult.active.policy.version).toBe(1);
    });
  });

  describe('POST /v1/policies/dry-run', () => {
    it('should return deny when no active policy', async () => {
      const request = {
        profile: 'nonexistent',
        action: {
          tool: 'http.get',
          url: 'https://api.example.com/data',
          method: 'GET',
        },
      };

      const response = await fetch(`${baseUrl}/v1/policies/dry-run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.ok).toBe(true);
      expect(result.result.decision).toBe('deny');
      expect(result.result.reason).toBe("Profile 'nonexistent' not found");
    });

    it('should evaluate request against active policy', async () => {
      // Publish and activate a policy first
      const policy = {
        version: 1,
        profiles: {
          researcher: {
            read_only: true,
            tools: ['http.get'],
            domains_allow: ['api.example.com'],
          },
        },
        defaults: { approvals_ttl_seconds: 3600 },
      };

      const publishResponse = await fetch(`${baseUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ policy }),
      });

      const publishResult = await publishResponse.json();
      const versionId = publishResult.version.id;

      await fetch(`${baseUrl}/v1/policies/activate/${versionId}`, {
        method: 'POST',
      });

      // Test dry-run with allowed request
      const request = {
        profile: 'researcher',
        action: {
          tool: 'http.get',
          url: 'https://api.example.com/data',
          method: 'GET',
        },
      };

      const response = await fetch(`${baseUrl}/v1/policies/dry-run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.ok).toBe(true);
      expect(result.result.decision).toBe('allow');
      expect(result.result.profile_applied).toBe('researcher');
    });

    it('should reject invalid dry-run request', async () => {
      const invalidRequest = {
        profile: 'researcher',
        // missing action
      };

      const response = await fetch(`${baseUrl}/v1/policies/dry-run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Invalid request');
    });
  });

  describe('GET /v1/policies/versions', () => {
    it('should return published versions', async () => {
      const response = await fetch(`${baseUrl}/v1/policies/versions`);
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.versions)).toBe(true);
      // Should have at least the versions created in previous tests
      expect(result.versions.length).toBeGreaterThanOrEqual(0);
    });

    it('should return published versions', async () => {
      // Publish a policy
      const policy = {
        version: 1,
        profiles: { test: { read_only: true } },
        defaults: { approvals_ttl_seconds: 3600 },
      };

      await fetch(`${baseUrl}/v1/policies/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ policy }),
      });

      const response = await fetch(`${baseUrl}/v1/policies/versions`);
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.ok).toBe(true);
      expect(result.versions.length).toBeGreaterThan(0);
    });
  });
});
