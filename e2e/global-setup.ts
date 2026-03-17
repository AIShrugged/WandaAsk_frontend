import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

/**
 * Global auth setup — runs once before all E2E tests.
 * Logs in via the login page and saves the session cookie (token)
 * to e2e/.auth/user.json so subsequent tests skip the login flow.
 *
 * Required env vars (in .env.playwright):
 *   E2E_EMAIL    — test user email
 *   E2E_PASSWORD — test user password
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL;

  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing E2E_EMAIL or E2E_PASSWORD. Copy .env.playwright.example to .env.playwright and fill in credentials.',
    );
  }

  await page.goto('/auth/login');

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait until we leave the login page — confirms login succeeded.
  // New users land on /auth/organization (onboarding), existing users on /dashboard.
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });

  // If the org selector appears, pick the first organization so that
  // the organization_id cookie gets set and dashboard pages work correctly.
  if (page.url().includes('/auth/organization')) {
    const firstOrg = page
      .locator('a, button')
      .filter({ hasText: /your role/i })
      .first();

    if (
      await firstOrg.isVisible({ timeout: 3000 }).catch(() => {
        return false;
      })
    ) {
      await firstOrg.click();
      await expect(page).not.toHaveURL(/\/auth\/organization/, {
        timeout: 10_000,
      });
    }
  }

  // Save auth state (cookies incl. token + organization_id) for reuse in all tests
  await page.context().storageState({ path: AUTH_FILE });
});
