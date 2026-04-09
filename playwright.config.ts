import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests.
 * Jest (unit/integration) and Playwright (E2E) run independently:
 *   npm test          → Jest (fast, no browser)
 *   npm run test:e2e  → Playwright (full browser, needs dev server)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    /** Setup project — runs login once, saves storageState */
    {
      name: 'setup',
      testMatch: '**/global-setup.ts',
    },

    /** Main tests — depend on setup for auth state */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
