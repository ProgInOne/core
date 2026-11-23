import { defineConfig } from 'vitest/config';

const UI_TESTS = 'packages/ui/src/**/*.test.{ts,tsx}';

export default defineConfig({
  resolve: {
    // Inside this repository, packages import each other's sources, not the built dist/.
    conditions: ['source'],
  },
  // Tests in the `node` project resolve like server code (SSR), which has its own conditions.
  // The rest of the list is Vite's default for server code.
  ssr: { resolve: { conditions: ['source', 'module', 'node', 'development|production'] } },
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/*/{src,scripts}/**/*.test.{ts,tsx}', 'tools/*.test.ts'],
          exclude: ['**/node_modules/**', UI_TESTS],
        },
      },
      {
        // React components need a DOM; everything else stays on plain Node.
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: [UI_TESTS],
          setupFiles: ['packages/ui/src/test/setup.ts'],
        },
      },
    ],
  },
});
