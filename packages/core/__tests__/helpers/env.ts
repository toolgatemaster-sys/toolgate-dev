export function getEnv(name: string, fallback?: string) {
  const v = process.env[name];
  if (v && v.trim() !== '') return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env: ${name}`);
}

// Test client HMAC key for reusability
export const TEST_CLIENT_HMAC = "dev-client-key";
