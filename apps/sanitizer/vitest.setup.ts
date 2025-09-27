import { afterEach, beforeAll, vi } from 'vitest';

// Env por defecto para tests
process.env.NODE_ENV ??= 'test';
process.env.SANITIZER_URL ??= 'http://localhost:8786';

beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => {
  vi.restoreAllMocks();
});
