import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'text'],
      reportsDirectory: 'coverage',
    },
    include: ['ts/__tests__/**/*.ts'],
    globals: true,
    logHeapUsage: true,
  },
});
