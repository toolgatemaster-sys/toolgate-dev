import { afterEach, beforeAll, vi } from 'vitest';

// Env por defecto para tests
process.env.NODE_ENV ??= 'test';
process.env.COLLECTOR_URL ??= 'http://localhost:8785';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';

beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => {
  vi.restoreAllMocks();
});
