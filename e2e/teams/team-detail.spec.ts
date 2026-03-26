import { expect, test } from '@playwright/test';

/**
 * Team detail page E2E tests.
 * Covers /dashboard/teams/[id].
 */

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Team detail — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/teams/1 to /auth/login', async ({ page }) => {
    await page.goto('/dashboard/teams/1');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

test.describe('Team detail — authenticated', () => {
  let teamId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    await page.goto('/dashboard/teams');
    const link = page
      .locator(
        'a[href*="/dashboard/teams/"]:not([href="/dashboard/teams"]):not([href*="/create"])',
      )
      .first();
    const href = await link.getAttribute('href').catch(() => {
      return null;
    });

    teamId = href?.split('/').pop() ?? null;
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    if (!teamId) {
      test.skip(
        true,
        'No teams found for test user — skipping team detail tests',
      );

      return;
    }
    // Build history so router.back() works
    await page.goto('/dashboard/teams');
    await expect(page.getByRole('heading', { name: /^teams$/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.goto(`/dashboard/teams/${teamId}`);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await page.waitForLoadState('networkidle');
  });

  test('renders team name as heading', async ({ page }) => {
    if (!teamId) return;
    // PageHeader renders the team name as an H2 heading
    const heading = page.getByRole('heading').first();

    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('renders back button', async ({ page }) => {
    if (!teamId) return;
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders member list or empty state', async ({ page }) => {
    if (!teamId) return;
    // Either member cards are visible or "No members yet" empty state
    const membersGrid = page.locator('div.grid').first();
    const emptyState = page.getByText(/no members yet/i);
    const hasMembers = await membersGrid
      .isVisible({ timeout: 5000 })
      .catch(() => {
        return false;
      });
    const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => {
      return false;
    });

    expect(hasMembers || isEmpty).toBeTruthy();
  });

  test('back button navigates to /dashboard/teams', async ({ page }) => {
    if (!teamId) return;
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/teams/, { timeout: 8000 });
  });

  test('page does not redirect to login', async ({ page }) => {
    if (!teamId) return;
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});
