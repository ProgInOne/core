import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Inside this repository, packages import each other's sources, not the built dist/.
    conditions: ['source'],
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/*/{src,scripts}/**/*.test.{ts,tsx}', 'tools/*.test.ts'],
          exclude: ['**/node_modules/**'],
        },
      },
    ],
  },
});
