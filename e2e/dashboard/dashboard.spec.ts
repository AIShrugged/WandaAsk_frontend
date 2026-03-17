import { expect, test } from '@playwright/test';

/**
 * Dashboard E2E tests.
 * Verifies the main dashboard page renders correctly for authenticated users.
 */

const DASHBOARD_URL = '/dashboard';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Dashboard — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects to /auth/login', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

test.describe('Dashboard — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Page structure
  // -------------------------------------------------------------------------

  test('renders welcome heading with username', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /welcome back/i }),
    ).toBeVisible();
  });

  test('renders all three stat cards', async ({ page }) => {
    // Stat card labels use text-muted-foreground inside the main content area
    const main = page.getByRole('main');

    await expect(
      main.locator('span.text-muted-foreground', { hasText: 'Teams' }),
    ).toBeVisible();
    await expect(
      main.locator('span.text-muted-foreground', { hasText: 'Chats' }),
    ).toBeVisible();
    await expect(
      main.locator('span.text-muted-foreground', { hasText: 'Methodologies' }),
    ).toBeVisible();
  });

  test('stat cards show numeric values', async ({ page }) => {
    // Each stat card has a large number — verify all 3 cards rendered
    const statValues = page.locator('.tabular-nums');

    await expect(statValues).toHaveCount(3);

    for (const value of await statValues.all()) {
      const text = await value.textContent();

      expect(Number(text)).not.toBeNaN();
    }
  });

  test('renders Recent Chats section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /recent chats/i }),
    ).toBeVisible();
  });

  test('"View all" link points to /dashboard/chat', async ({ page }) => {
    const viewAllLink = page.getByRole('link', { name: /view all/i });

    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute('href', /\/dashboard\/chat/);
  });

  // -------------------------------------------------------------------------
  // Quick links
  // -------------------------------------------------------------------------

  test('renders all four quick-link buttons', async ({ page }) => {
    // Quick links are in the last grid inside main (not sidebar nav)
    const quickLinksGrid = page.getByRole('main').locator('div.grid').last();

    await expect(
      quickLinksGrid.getByRole('link', { name: /^teams$/i }),
    ).toBeVisible();
    await expect(
      quickLinksGrid.getByRole('link', { name: /^calendar$/i }),
    ).toBeVisible();
    await expect(
      quickLinksGrid.getByRole('link', { name: /^methodology$/i }),
    ).toBeVisible();
    await expect(
      quickLinksGrid.getByRole('link', { name: /^statistics$/i }),
    ).toBeVisible();
  });

  test('Teams quick-link navigates to /dashboard/teams', async ({ page }) => {
    // Use the quick-link in main, not the sidebar nav link
    const quickLinksGrid = page.getByRole('main').locator('div.grid').last();

    await quickLinksGrid.getByRole('link', { name: /^teams$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/teams/);
  });

  // -------------------------------------------------------------------------
  // Sidebar navigation
  // -------------------------------------------------------------------------

  test('sidebar is visible on desktop', async ({ page }) => {
    // Desktop sidebar has role="complementary"; mobile sidebar is aria-hidden
    await expect(page.getByRole('complementary')).toBeVisible();
  });
});
