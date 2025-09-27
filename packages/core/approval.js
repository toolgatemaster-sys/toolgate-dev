// Approval helpers for Day 5
/**
 * Generate a unique approval ID
 */
export function genApprovalId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `apr_${timestamp}_${random}`;
}
/**
 * Compute expiration timestamp
 */
export function computeExpiresAt(createdAt, ttlSeconds = 3600) {
    return createdAt + (ttlSeconds * 1000);
}
/**
 * Check if approval is expired
 */
export function isExpired(approval) {
    return Date.now() > approval.expiresAt;
}
/**
 * Create approval context from request
 */
export function createApprovalContext(req) {
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
export function hashBody(body) {
    if (!body)
        return 'empty';
    try {
        // Recursively sort object keys to ensure consistent ordering
        const normalized = JSON.stringify(body, (key, value) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const sorted = {};
                Object.keys(value).sort().forEach(k => {
                    sorted[k] = value[k];
                });
                return sorted;
            }
            return value;
        });
        return btoa(normalized).slice(0, 32); // Base64 encode and truncate
    }
    catch (error) {
        // Fallback to string representation if JSON fails
        return btoa(String(body)).slice(0, 32);
    }
}
