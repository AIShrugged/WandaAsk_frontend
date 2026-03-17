import { expect, test } from '@playwright/test';

/**
 * Landing page E2E tests.
 * Covers / (root route) — publicly accessible, no auth required.
 */

// Landing page is public — use empty storageState
test.describe('Landing page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Landing page should render without redirect
    await expect(page).toHaveURL(/^http:\/\/localhost:8080\/$/);
  });

  test('renders page without redirect', async ({ page }) => {
    await expect(page).toHaveURL(/^http:\/\/localhost:8080\//);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('renders main hero heading', async ({ page }) => {
    // LandingHero renders an HeroTyping headline and subtitle text
    // Look for any heading in the page
    const heading = page.getByRole('heading').first();

    const heroText = page.getByText(/tribes|meeting|ai|intelligence/i).first();

    const hasHeading = await heading
      .isVisible({ timeout: 10_000 })
      .catch(() => {
        return false;
      });

    const hasHeroText = await heroText
      .isVisible({ timeout: 5000 })
      .catch(() => {
        return false;
      });

    expect(hasHeading || hasHeroText).toBeTruthy();
  });

  test('renders navigation bar with "Tribes" logo text', async ({ page }) => {
    // LandingNav renders a nav element with "Tribes" text
    const nav = page.locator('nav').first();

    await expect(nav).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Tribes').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders CTA button that links to /auth/login or /auth/register', async ({
    page,
  }) => {
    // LandingHero has "Start for Free →" (to /auth/register) and "Sign In" (to /auth/login)
    // LandingNav has "Sign In" and "Get Started" buttons
    const ctaLink = page
      .getByRole('link', { name: /get started|start for free|sign in|log in/i })
      .first();

    await expect(ctaLink).toBeVisible({ timeout: 10_000 });

    const href = await ctaLink.getAttribute('href');

    expect(href).toMatch(/\/auth\/(login|register)/);
  });

  test('landing page snapshot matches baseline', async ({ page }) => {
    // Wait for any animations/JS effects to settle
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('landing-page.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
