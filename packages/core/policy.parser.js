import { validatePolicy } from './policy.schema.js';
/**
 * Parse YAML policy content into validated Policy object
 */
export function parseYaml(yamlContent) {
    try {
        // Simple YAML-like parsing for basic policy structure
        const parsed = parseSimpleYaml(yamlContent);
        return validatePolicy(parsed);
    }
    catch (error) {
        throw new Error(`Failed to parse policy YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Simple YAML parser for basic policy structure
 * This is a minimal implementation for Day 3
 */
function parseSimpleYaml(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    const result = { version: 1, profiles: {}, defaults: { approvals_ttl_seconds: 3600 } };
    let currentSection = null;
    let currentProfile = null;
    for (const line of lines) {
        if (line.includes(':')) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key === 'version') {
                result.version = parseInt(value);
            }
            else if (key === 'profiles') {
                currentSection = 'profiles';
                result.profiles = {};
            }
            else if (key === 'defaults') {
                currentSection = 'defaults';
                result.defaults = { approvals_ttl_seconds: 3600 };
            }
            else if (currentSection === 'profiles') {
                if (value.endsWith(':')) {
                    currentProfile = key;
                    result.profiles[key] = {};
                }
                else if (currentProfile) {
                    parseProfileField(result.profiles[currentProfile], key, value);
                }
            }
            else if (currentSection === 'defaults') {
                parseDefaultsField(result.defaults, key, value);
            }
        }
        else if (line.startsWith('- ')) {
            // Handle array values
            const value = line.substring(2);
            if (currentProfile && currentSection === 'profiles') {
                // This is a simple array handling
                const lastKey = Object.keys(result.profiles[currentProfile]).pop();
                if (lastKey && Array.isArray(result.profiles[currentProfile][lastKey])) {
                    result.profiles[currentProfile][lastKey].push(value);
                }
            }
        }
    }
    return result;
}
function parseProfileField(profile, key, value) {
    switch (key) {
        case 'read_only':
            profile.read_only = value === 'true';
            break;
        case 'tools':
            profile.tools = value.split(',').map(s => s.trim());
            break;
        case 'domains_allow':
            profile.domains_allow = value.split(',').map(s => s.trim());
            break;
        case 'domains_deny':
            profile.domains_deny = value.split(',').map(s => s.trim());
            break;
        case 'rpm':
            if (!profile.budgets)
                profile.budgets = {};
            profile.budgets.rpm = parseInt(value);
            break;
        case 'rph':
            if (!profile.budgets)
                profile.budgets = {};
            profile.budgets.rph = parseInt(value);
            break;
        case 'tokens_per_day':
            if (!profile.budgets)
                profile.budgets = {};
            profile.budgets.tokens_per_day = parseInt(value);
            break;
    }
}
function parseDefaultsField(defaults, key, value) {
    switch (key) {
        case 'approvals_ttl_seconds':
            defaults.approvals_ttl_seconds = parseInt(value);
            break;
        case 'default_profile':
            defaults.default_profile = value;
            break;
    }
}
