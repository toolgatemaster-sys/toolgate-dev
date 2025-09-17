import { 
  Policy, 
  Profile, 
  PolicyEvaluationRequest, 
  PolicyEvaluationResult,
  validatePolicyEvaluationRequest 
} from './policy.schema.js';

/**
 * Evaluate a policy against a request to determine allow/deny/pending
 */
export function evaluate(policy: Policy, request: unknown): PolicyEvaluationResult {
  // Validate the request
  const validatedRequest = validatePolicyEvaluationRequest(request);
  
  // Get the profile for this request
  const profile = policy.profiles[validatedRequest.profile];
  if (!profile) {
    return {
      decision: 'deny',
      reason: `Profile '${validatedRequest.profile}' not found`,
      profile_applied: validatedRequest.profile,
    };
  }
  
  // Apply profile rules
  const result = applyProfileRules(profile, validatedRequest, policy);
  
  return {
    ...result,
    profile_applied: validatedRequest.profile,
  };
}

/**
 * Apply profile-specific rules to determine decision
 */
function applyProfileRules(
  profile: Profile, 
  request: PolicyEvaluationRequest, 
  policy: Policy
): Omit<PolicyEvaluationResult, 'profile_applied'> {
  
  // Check tool allowlist first
  if (profile.tools && profile.tools.length > 0 && !profile.tools.includes(request.action.tool)) {
    return {
      decision: 'deny',
      reason: `Tool '${request.action.tool}' not allowed for this profile`,
      constraints: { rate_limited: false },
    };
  }
  
  // Check domain restrictions
  if (request.action.url) {
    const url = new URL(request.action.url);
    const domain = url.hostname;
    
    // Check deny list first
    if (profile.domains_deny && profile.domains_deny.some(denied => domain.includes(denied))) {
      return {
        decision: 'deny',
        reason: `Domain '${domain}' is in deny list`,
        constraints: { rate_limited: false },
      };
    }
    
    // Check allow list
    if (profile.domains_allow && profile.domains_allow.length > 0 && 
        !profile.domains_allow.some(allowed => domain.includes(allowed) || allowed === '*')) {
      return {
        decision: 'deny',
        reason: `Domain '${domain}' not in allow list`,
        constraints: { rate_limited: false },
      };
    }
  }
  
  // Check read-only restriction after tool and domain checks
  if (profile.read_only && request.action.method !== 'GET') {
    return {
      decision: 'deny',
      reason: 'Profile is read-only, only GET requests allowed',
      constraints: { rate_limited: false },
    };
  }
  
  // Default allow if all checks pass
  return {
    decision: 'allow',
    reason: 'Request allowed by profile rules',
    constraints: { 
      rate_limited: false,
      requires_approval: shouldRequireApproval(profile, request),
    },
  };
}

/**
 * Determine if request requires approval based on profile and context
 */
function shouldRequireApproval(profile: Profile, request: PolicyEvaluationRequest): boolean {
  // For Day 3, we'll require approval for high-risk tools or domains
  const highRiskTools = ['shell.execute', 'file.write', 'database.query'];
  const highRiskDomains = ['admin.', 'internal.', 'localhost'];
  
  if (highRiskTools.includes(request.action.tool)) {
    return true;
  }
  
  if (request.action.url) {
    const url = new URL(request.action.url);
    const domain = url.hostname;
    if (highRiskDomains.some(risk => domain.includes(risk))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get active policy version (for versioning support)
 */
export function getActivePolicyVersion(policy: Policy): number {
  return policy.version;
}

/**
 * Check if policy has specific profile
 */
export function hasProfile(policy: Policy, profileName: string): boolean {
  return profileName in policy.profiles;
}

/**
 * Get profile by name from policy
 */
export function getProfile(policy: Policy, profileName: string): Profile | null {
  return policy.profiles[profileName] || null;
}