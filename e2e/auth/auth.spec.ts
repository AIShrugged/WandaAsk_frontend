import { expect, test } from '@playwright/test';

/**
 * Authentication E2E tests.
 * Verifies login flow, redirect behaviour, and session persistence.
 */

test.describe('Authentication', () => {
  test.describe('unauthenticated access', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects /dashboard to /auth/login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('redirects /dashboard/profile to /auth/login', async ({ page }) => {
      await page.goto('/dashboard/profile');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('login page renders email and password fields', async ({ page }) => {
      await page.goto('/auth/login');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    });

    test('shows error on wrong credentials', async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /log in/i }).click();

      await expect(
        page
          .getByRole('alert')
          .or(page.getByText(/invalid|incorrect|wrong|failed/i)),
      ).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('authenticated session', () => {
    test('authenticated user can reach /dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).not.toHaveURL(/\/auth\/login/);
    });

    test('authenticated user can reach /dashboard/profile', async ({
      page,
    }) => {
      await page.goto('/dashboard/profile');
      await expect(page).not.toHaveURL(/\/auth\/login/);
      await expect(
        page.getByRole('heading', { name: /profile/i }),
      ).toBeVisible();
    });
  });
});
