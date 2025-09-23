import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createGateway } from '../src/server.js';

describe('Gateway Approvals API', () => {
  let gateway: any;
  let gatewayUrl: string;

  const gatewayPort = 8789; // Different port to avoid conflicts

  beforeAll(async () => {
    gateway = await createGateway();
    await gateway.listen({ port: gatewayPort });
    gatewayUrl = `http://127.0.0.1:${gatewayPort}`;
  });

  afterAll(async () => {
    try { await gateway?.close(); } catch {}
  });

  describe('GET /api/approvals', () => {
    it('should return empty list initially', async () => {
      const res = await fetch(`${gatewayUrl}/api/approvals`);
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body).toHaveProperty('items');
      expect(body.items).toEqual([]);
    });

    it('should filter by status', async () => {
      const res = await fetch(`${gatewayUrl}/api/approvals?status=pending`);
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body).toHaveProperty('items');
      expect(Array.isArray(body.items)).toBe(true);
    });
  });

  describe('GET /api/approvals/:id', () => {
    it('should return 404 for non-existent approval', async () => {
      const res = await fetch(`${gatewayUrl}/api/approvals/non-existent-id`);
      expect(res.status).toBe(404);
      
      const body = await res.json();
      expect(body).toHaveProperty('error', 'not_found');
    });
  });

  describe('POST /api/approvals/:id/approve', () => {
    it('should return 404 for non-existent approval', async () => {
      const res = await fetch(`${gatewayUrl}/api/approvals/non-existent-id/approve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: 'test approval' }),
      });
      
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toHaveProperty('error', 'not_found');
    });
  });

  describe('POST /api/approvals/:id/deny', () => {
    it('should return 404 for non-existent approval', async () => {
      const res = await fetch(`${gatewayUrl}/api/approvals/non-existent-id/deny`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: 'test denial' }),
      });
      
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toHaveProperty('error', 'not_found');
    });
  });

  describe('GET /api/approvals/stats', () => {
    it('should return store statistics', async () => {
      const res = await fetch(`${gatewayUrl}/api/approvals/stats`);
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('byStatus');
      expect(body.byStatus).toHaveProperty('pending');
      expect(body.byStatus).toHaveProperty('approved');
      expect(body.byStatus).toHaveProperty('denied');
      expect(body.byStatus).toHaveProperty('expired');
      expect(body.total).toBe(0);
    });
  });
});

describe('Approval Store Integration', () => {
  let gateway: any;
  let gatewayUrl: string;

  const gatewayPort = 8790; // Different port for integration tests

  beforeAll(async () => {
    gateway = await createGateway();
    await gateway.listen({ port: gatewayPort });
    gatewayUrl = `http://127.0.0.1:${gatewayPort}`;
  });

  afterAll(async () => {
    try { await gateway?.close(); } catch {}
  });

  it('should create, approve, and deny approvals', async () => {
    // Create an approval by calling the store directly (simulating pending decision)
    const { approvalsStore } = await import('../src/approvals.store.js');
    
    const approval = approvalsStore.createApproval(
      {
        tool: 'http.get',
        domain: 'example.com',
        method: 'GET',
        path: '/test',
      },
      'policy',
      3600
    );

    expect(approval.status).toBe('pending');
    expect(approval.id).toMatch(/^apr_/);

    // Test GET /api/approvals/:id
    const getRes = await fetch(`${gatewayUrl}/api/approvals/${approval.id}`);
    expect(getRes.status).toBe(200);
    
    const approvalData = await getRes.json();
    expect(approvalData.id).toBe(approval.id);
    expect(approvalData.status).toBe('pending');

    // Test approve
    const approveRes = await fetch(`${gatewayUrl}/api/approvals/${approval.id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'approved for testing' }),
    });
    
    expect(approveRes.status).toBe(200);
    const approveBody = await approveRes.json();
    expect(approveBody).toHaveProperty('status', 'approved');

    // Verify approval status changed
    const updatedApproval = approvalsStore.getApproval(approval.id);
    expect(updatedApproval?.status).toBe('approved');
    expect(updatedApproval?.note).toBe('approved for testing');
  });

  it('should handle approval expiry', async () => {
    const { approvalsStore } = await import('../src/approvals.store.js');
    
    // Create an approval with very short TTL
    const approval = approvalsStore.createApproval(
      {
        tool: 'http.post',
        domain: 'test.com',
        method: 'POST',
        path: '/test',
      },
      'policy',
      1 // 1 second TTL
    );

    expect(approval.status).toBe('pending');

    // Wait for expiry and manually trigger expireOld
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait 1.1 seconds
    const expiredCount = approvalsStore.expireOld();
    
    expect(expiredCount).toBeGreaterThan(0);
    
    const expiredApproval = approvalsStore.getApproval(approval.id);
    expect(expiredApproval?.status).toBe('expired');
  });
});