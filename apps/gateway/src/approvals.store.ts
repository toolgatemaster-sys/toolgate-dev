// In-memory approvals store for Day 5

import { Approval, ApprovalStatus, genApprovalId, computeExpiresAt, createApprovalContext } from '../../../packages/core/approval.js';

export class ApprovalsStore {
  private approvals = new Map<string, Approval>();

  /**
   * Create a new approval
   */
  createApproval(
    ctx: Approval['ctx'],
    reason?: string,
    ttlSeconds: number = 3600,
    agentId?: string
  ): Approval {
    const now = Date.now();
    const approval: Approval = {
      id: genApprovalId(),
      agentId,
      createdAt: now,
      expiresAt: computeExpiresAt(now, ttlSeconds),
      reason: reason || 'policy',
      ctx,
      status: 'pending',
    };

    this.approvals.set(approval.id, approval);
    return approval;
  }

  /**
   * Get approval by ID
   */
  getApproval(id: string): Approval | null {
    return this.approvals.get(id) || null;
  }

  /**
   * List approvals with optional filters
   */
  listApprovals(filters?: {
    status?: ApprovalStatus;
    agentId?: string;
  }): Approval[] {
    let results = Array.from(this.approvals.values());

    if (filters?.status) {
      results = results.filter(approval => approval.status === filters.status);
    }

    if (filters?.agentId) {
      results = results.filter(approval => approval.agentId === filters.agentId);
    }

    // Sort by creation date (newest first)
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Approve an approval
   */
  approve(id: string, note?: string): Approval | null {
    const approval = this.approvals.get(id);
    if (!approval) {
      return null;
    }

    if (approval.status !== 'pending') {
      throw new Error(`Cannot approve approval ${id} with status ${approval.status}`);
    }

    approval.status = 'approved';
    if (note) {
      approval.note = note;
    }

    return approval;
  }

  /**
   * Deny an approval
   */
  deny(id: string, note?: string): Approval | null {
    const approval = this.approvals.get(id);
    if (!approval) {
      return null;
    }

    if (approval.status !== 'pending') {
      throw new Error(`Cannot deny approval ${id} with status ${approval.status}`);
    }

    approval.status = 'denied';
    if (note) {
      approval.note = note;
    }

    return approval;
  }

  /**
   * Expire old pending approvals
   */
  expireOld(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const approval of this.approvals.values()) {
      if (approval.status === 'pending' && now > approval.expiresAt) {
        approval.status = 'expired';
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Get store statistics
   */
  getStats(): { total: number; byStatus: Record<ApprovalStatus, number> } {
    const total = this.approvals.size;
    const byStatus: Record<ApprovalStatus, number> = {
      pending: 0,
      approved: 0,
      denied: 0,
      expired: 0,
    };

    for (const approval of this.approvals.values()) {
      byStatus[approval.status]++;
    }

    return { total, byStatus };
  }
}

// Global store instance
export const approvalsStore = new ApprovalsStore();

/**
 * Start background cron to expire old approvals
 */
export function startExpiryCron(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(() => {
    const expiredCount = approvalsStore.expireOld();
    if (expiredCount > 0) {
      console.log(`[approvals] Expired ${expiredCount} old approvals`);
    }
  }, intervalMs);
}