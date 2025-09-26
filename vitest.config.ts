import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    environment: 'jsdom',
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      thresholds: {
        lines: 0.8,
        branches: 0.7,
        functions: 0.8,
        statements: 0.8
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web'),
    },
  },
});