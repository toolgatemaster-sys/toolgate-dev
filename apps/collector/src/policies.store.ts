import { Policy, PolicyEvaluationRequest, PolicyEvaluationResult } from '../../../packages/core/dist/policy.schema.js';

export interface PolicyVersion {
  id: string;
  version: number;
  policy: Policy;
  published_at: Date;
  is_active: boolean;
}

export interface PolicyStore {
  publish(policy: Policy): Promise<PolicyVersion>;
  getActive(): Promise<PolicyVersion | null>;
  getAllVersions(): Promise<PolicyVersion[]>;
  activateVersion(versionId: string): Promise<boolean>;
  dryRun(request: PolicyEvaluationRequest): Promise<PolicyEvaluationResult>;
}

export class InMemoryPolicyStore implements PolicyStore {
  private versions: Map<string, PolicyVersion> = new Map();
  private activeVersion: PolicyVersion | null = null;
  private versionCounter = 0;

  async publish(policy: Policy): Promise<PolicyVersion> {
    const versionId = `v${++this.versionCounter}`;
    const version: PolicyVersion = {
      id: versionId,
      version: policy.version,
      policy,
      published_at: new Date(),
      is_active: false,
    };

    this.versions.set(versionId, version);
    return version;
  }

  async getActive(): Promise<PolicyVersion | null> {
    return this.activeVersion;
  }

  async getAllVersions(): Promise<PolicyVersion[]> {
    return Array.from(this.versions.values()).sort(
      (a, b) => b.published_at.getTime() - a.published_at.getTime()
    );
  }

  async activateVersion(versionId: string): Promise<boolean> {
    const version = this.versions.get(versionId);
    if (!version) {
      return false;
    }

    // Deactivate current active version
    if (this.activeVersion) {
      this.activeVersion.is_active = false;
    }

    // Activate new version
    version.is_active = true;
    this.activeVersion = version;
    return true;
  }

  async dryRun(request: PolicyEvaluationRequest): Promise<PolicyEvaluationResult> {
    if (!this.activeVersion) {
      return {
        decision: 'deny',
        reason: 'No active policy found',
        profile_applied: request.profile,
      };
    }

    // Import evaluate function dynamically to avoid circular dependencies
    const { evaluate } = await import('../../../packages/core/dist/policy.evaluate.js');
    return evaluate(this.activeVersion.policy, request);
  }
}

// Singleton instance for the application
export const policyStore = new InMemoryPolicyStore();