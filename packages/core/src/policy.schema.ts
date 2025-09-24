// Policy types without external dependencies

export interface Profile {
  read_only?: boolean;
  tools?: string[];
  domains_allow?: string[];
  domains_deny?: string[];
  budgets?: {
    rpm?: number;
    rph?: number;
    tokens_per_day?: number;
  };
  // Tools that require approval for this profile
  tools_require_approval?: string[];
  // Domains that require approval for this profile
  domains_require_approval?: string[];
}

export interface Policy {
  version: number;
  profiles: Record<string, Profile>;
  defaults: {
    approvals_ttl_seconds: number;
    default_profile?: string;
  };
}

export interface PolicyEvaluationRequest {
  profile: string;
  action: {
    tool: string;
    url?: string;
    method?: string;
  };
  context?: {
    user_id?: string;
    session_id?: string;
  };
}

export interface PolicyEvaluationResult {
  decision: 'allow' | 'deny' | 'pending';
  reason?: string;
  profile_applied: string;
  constraints?: {
    rate_limited?: boolean;
    requires_approval?: boolean;
  };
}

// Validation function using manual checks
export function validatePolicy(obj: unknown): Policy {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Policy must be an object');
  }

  const policy = obj as any;

  // Validate version
  if (typeof policy.version !== 'number' || policy.version < 1) {
    throw new Error('Policy version must be a positive number');
  }

  // Validate profiles
  if (!policy.profiles || typeof policy.profiles !== 'object') {
    throw new Error('Policy must have profiles object');
  }

  // Validate each profile
  for (const [name, profile] of Object.entries(policy.profiles)) {
    if (!profile || typeof profile !== 'object') {
      throw new Error(`Profile '${name}' must be an object`);
    }
    validateProfile(profile as any);
  }

  // Validate defaults
  if (!policy.defaults || typeof policy.defaults !== 'object') {
    throw new Error('Policy must have defaults object');
  }

  const defaults = policy.defaults as any;
  if (typeof defaults.approvals_ttl_seconds !== 'number' || defaults.approvals_ttl_seconds < 1) {
    throw new Error('approvals_ttl_seconds must be a positive number');
  }

  return policy as Policy;
}

function validateProfile(profile: any): void {
  // Validate read_only
  if (profile.read_only !== undefined && typeof profile.read_only !== 'boolean') {
    throw new Error('Profile read_only must be boolean');
  }

  // Validate tools
  if (profile.tools !== undefined) {
    if (!Array.isArray(profile.tools)) {
      throw new Error('Profile tools must be an array');
    }
    if (!profile.tools.every((tool: any) => typeof tool === 'string')) {
      throw new Error('Profile tools must be array of strings');
    }
  }

  // Validate domains
  ['domains_allow', 'domains_deny'].forEach(field => {
    if (profile[field] !== undefined) {
      if (!Array.isArray(profile[field])) {
        throw new Error(`Profile ${field} must be an array`);
      }
      if (!profile[field].every((domain: any) => typeof domain === 'string')) {
        throw new Error(`Profile ${field} must be array of strings`);
      }
    }
  });

  // Validate budgets
  if (profile.budgets !== undefined) {
    if (!profile.budgets || typeof profile.budgets !== 'object') {
      throw new Error('Profile budgets must be an object');
    }
    
    ['rpm', 'rph', 'tokens_per_day'].forEach(field => {
      if (profile.budgets[field] !== undefined) {
        if (typeof profile.budgets[field] !== 'number' || profile.budgets[field] < 1) {
          throw new Error(`Budget ${field} must be a positive number`);
        }
      }
    });
  }
}

export function validatePolicyEvaluationRequest(obj: unknown): PolicyEvaluationRequest {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Policy evaluation request must be an object');
  }

  const req = obj as any;

  // Validate profile
  if (typeof req.profile !== 'string' || !req.profile.trim()) {
    throw new Error('Request profile must be a non-empty string');
  }

  // Validate action
  if (!req.action || typeof req.action !== 'object') {
    throw new Error('Request must have action object');
  }

  if (typeof req.action.tool !== 'string' || !req.action.tool.trim()) {
    throw new Error('Action tool must be a non-empty string');
  }

  if (req.action.url !== undefined && typeof req.action.url !== 'string') {
    throw new Error('Action url must be a string');
  }

  if (req.action.method !== undefined && typeof req.action.method !== 'string') {
    throw new Error('Action method must be a string');
  }

  // Validate context (optional)
  if (req.context !== undefined) {
    if (!req.context || typeof req.context !== 'object') {
      throw new Error('Request context must be an object');
    }
    if (req.context.user_id !== undefined && typeof req.context.user_id !== 'string') {
      throw new Error('Context user_id must be a string');
    }
    if (req.context.session_id !== undefined && typeof req.context.session_id !== 'string') {
      throw new Error('Context session_id must be a string');
    }
  }

  return req as PolicyEvaluationRequest;
}