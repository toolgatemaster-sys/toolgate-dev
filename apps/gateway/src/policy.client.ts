import { Policy } from '../../../packages/core/dist/policy.schema.js';

export interface PolicyClient {
  getActivePolicy(): Promise<Policy | null>;
  isCacheValid(): boolean;
  clearCache(): void;
}

export interface PolicyCacheEntry {
  policy: Policy;
  fetchedAt: Date;
  ttlMs: number;
}

export class TTLPolicyClient implements PolicyClient {
  private cache: PolicyCacheEntry | null = null;
  private readonly collectorUrl: string;
  private readonly ttlMs: number;

  constructor(collectorUrl: string, ttlMs = 30000) { // 30 seconds default
    this.collectorUrl = collectorUrl;
    this.ttlMs = ttlMs;
  }

  async getActivePolicy(): Promise<Policy | null> {
    // Return cached policy if still valid
    if (this.isCacheValid() && this.cache) {
      return this.cache.policy;
    }

    try {
      // Fetch from collector
      const response = await fetch(`${this.collectorUrl}/v1/policies/active`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch active policy: ${response.status} ${response.statusText}`);
        return this.cache?.policy || null; // Return stale cache if available
      }

      const data = await response.json();
      
      if (!data.ok || !data.active) {
        return null;
      }

      // Update cache
      this.cache = {
        policy: data.active.policy,
        fetchedAt: new Date(),
        ttlMs: this.ttlMs,
      };

      return data.active.policy;
    } catch (error) {
      console.error('Error fetching active policy:', error);
      return this.cache?.policy || null; // Return stale cache if available
    }
  }

  isCacheValid(): boolean {
    if (!this.cache) {
      return false;
    }

    const now = new Date();
    const cacheAge = now.getTime() - this.cache.fetchedAt.getTime();
    return cacheAge < this.cache.ttlMs;
  }

  clearCache(): void {
    this.cache = null;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { isValid: boolean; age: number; ttl: number } {
    if (!this.cache) {
      return { isValid: false, age: 0, ttl: this.ttlMs };
    }

    const now = new Date();
    const age = now.getTime() - this.cache.fetchedAt.getTime();
    return {
      isValid: this.isCacheValid(),
      age,
      ttl: this.cache.ttlMs,
    };
  }
}

// Factory function to create policy client
export function createPolicyClient(collectorUrl: string, ttlMs?: number): PolicyClient {
  return new TTLPolicyClient(collectorUrl, ttlMs);
}