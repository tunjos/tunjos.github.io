import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests from the test/ directory
    include: ['test/**/*.test.js'],
    // jsdom environment simulates browser DOM for JS module tests
    environment: 'jsdom',
    // Report each test name
    reporter: 'verbose',
    // Minimum 100 runs for property-based tests (fast-check default can be lower)
    globals: false,
  },
});
