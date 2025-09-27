import { vi } from 'vitest';

// Mock node:dns para evitar setDefaultResultOrder error en tests
vi.mock('node:dns', () => ({
  setDefaultResultOrder: () => {}
}));

// Env por defecto para tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.COLLECTOR_URL = process.env.COLLECTOR_URL || 'http://127.0.0.1:8787';
process.env.GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:8788';


