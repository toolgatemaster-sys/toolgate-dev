// Approval routes for Day 5

import type { FastifyInstance } from 'fastify';
import { approvalsStore } from './approvals.store.js';

export async function registerApprovalRoutes(app: FastifyInstance) {
  
  // GET /api/approvals - List approvals with optional filters
  app.get('/api/approvals', async (req, reply) => {
    try {
      const { status, agentId } = req.query as {
        status?: string;
        agentId?: string;
      };

      const filters: any = {};
      if (status) filters.status = status;
      if (agentId) filters.agentId = agentId;

      const approvals = approvalsStore.listApprovals(filters);
      
      return reply.send({ items: approvals });
    } catch (error) {
      app.log.error({ error }, 'Failed to list approvals');
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  // GET /api/approvals/:id - Get specific approval
  app.get('/api/approvals/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      
      const approval = approvalsStore.getApproval(id);
      
      if (!approval) {
        return reply.code(404).send({ error: 'not_found' });
      }

      return reply.send(approval);
    } catch (error) {
      app.log.error({ error }, 'Failed to get approval');
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  // POST /api/approvals/:id/approve - Approve an approval
  app.post('/api/approvals/:id/approve', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { note } = req.body as { note?: string } || {};

      const approval = approvalsStore.approve(id, note);
      
      if (!approval) {
        return reply.code(404).send({ error: 'not_found' });
      }

      return reply.send({ status: 'approved' });
    } catch (error) {
      app.log.error({ error }, 'Failed to approve');
      
      if (error instanceof Error && error.message.includes('Cannot approve')) {
        return reply.code(400).send({ error: 'invalid_status' });
      }
      
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  // POST /api/approvals/:id/deny - Deny an approval
  app.post('/api/approvals/:id/deny', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { note } = req.body as { note?: string } || {};

      const approval = approvalsStore.deny(id, note);
      
      if (!approval) {
        return reply.code(404).send({ error: 'not_found' });
      }

      return reply.send({ status: 'denied' });
    } catch (error) {
      app.log.error({ error }, 'Failed to deny');
      
      if (error instanceof Error && error.message.includes('Cannot deny')) {
        return reply.code(400).send({ error: 'invalid_status' });
      }
      
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  // GET /api/approvals/stats - Get store statistics (bonus endpoint)
  app.get('/api/approvals/stats', async (req, reply) => {
    try {
      const stats = approvalsStore.getStats();
      return reply.send(stats);
    } catch (error) {
      app.log.error({ error }, 'Failed to get stats');
      return reply.code(500).send({ error: 'internal_error' });
    }
  });
}