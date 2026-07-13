import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'jsdom',
    include:     ['**/*.test.ts', '**/*.test.tsx'],
    exclude:     ['node_modules', 'e2e'],
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
