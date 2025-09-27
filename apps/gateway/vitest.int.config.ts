import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.int.ts'],
    include: ['**/*.int.test.ts'], // only integration tests
    testTimeout: 30000,
    reporters: ['dot'],
  },
});
