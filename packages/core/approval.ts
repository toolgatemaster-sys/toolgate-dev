// Approval helpers for Day 5

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";

export interface Approval {
  id: string;            // apr_<rand>
  agentId?: string;
  createdAt: number;
  expiresAt: number;     // default TTL 3600s
  reason?: string;       // e.g. "policy"
  ctx: {
    tool?: string;
    domain?: string;
    method?: string;
    path?: string;
    bodyHash?: string;
  };
  status: ApprovalStatus;
  note?: string;
}

/**
 * Generate a unique approval ID
 */
export function genApprovalId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `apr_${timestamp}_${random}`;
}

/**
 * Compute expiration timestamp
 */
export function computeExpiresAt(createdAt: number, ttlSeconds: number = 3600): number {
  return createdAt + (ttlSeconds * 1000);
}

/**
 * Check if approval is expired
 */
export function isExpired(approval: Approval): boolean {
  return Date.now() > approval.expiresAt;
}

/**
 * Create approval context from request
 */
export function createApprovalContext(req: any): Approval['ctx'] {
  const body = req.body || {};
  const url = req.url || '';
  
  return {
    tool: body.tool || body.attrs?.tool,
    domain: body.url ? new URL(body.url).hostname : undefined,
    method: req.method,
    path: url,
    bodyHash: hashBody(body),
  };
}

/**
 * Generate a stable hash for request body (for retry/idempotency)
 */
export function hashBody(body: unknown): string {
  if (!body) return 'empty';
  
  try {
    // Recursively sort object keys to ensure consistent ordering
    const normalized = JSON.stringify(body, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sorted: Record<string, any> = {};
        Object.keys(value).sort().forEach(k => {
          sorted[k] = value[k];
        });
        return sorted;
      }
      return value;
    });
    return btoa(normalized).slice(0, 32); // Base64 encode and truncate
  } catch (error) {
    // Fallback to string representation if JSON fails
    return btoa(String(body)).slice(0, 32);
  }
}