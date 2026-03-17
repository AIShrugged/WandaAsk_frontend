import { expect, test } from '@playwright/test';

/**
 * Teams list and create page E2E tests.
 * Covers /dashboard/teams and /dashboard/teams/create.
 */

const TEAMS_URL = '/dashboard/teams';

const TEAMS_CREATE_URL = '/dashboard/teams/create';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Teams — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/teams to /auth/login', async ({ page }) => {
    await page.goto(TEAMS_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects /dashboard/teams/create to /auth/login', async ({ page }) => {
    await page.goto(TEAMS_CREATE_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Teams list
// ---------------------------------------------------------------------------

test.describe('Teams list — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEAMS_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: /^teams$/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders "Teams" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^teams$/i })).toBeVisible();
  });

  test('renders "Create" button or link', async ({ page }) => {
    // The "Create" button is a link with href /dashboard/teams/create
    await expect(page.getByRole('link', { name: /create/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders team list OR empty state', async ({ page }) => {
    const teamLink = page.locator('a[href*="/dashboard/teams/"]').first();

    const emptyText = page.getByText(/no team in this organization/i);

    const hasTeams = await teamLink.isVisible({ timeout: 5000 }).catch(() => {
      return false;
    });

    const isEmpty = await emptyText.isVisible({ timeout: 3000 }).catch(() => {
      return false;
    });

    expect(hasTeams || isEmpty).toBeTruthy();
  });

  test('clicking a team navigates to /dashboard/teams/[id]', async ({
    page,
  }) => {
    const firstTeamLink = page.locator('a[href*="/dashboard/teams/"]').first();

    const isVisible = await firstTeamLink
      .isVisible({ timeout: 5000 })
      .catch(() => {
        return false;
      });

    if (!isVisible) {
      test.skip(true, 'No teams found — skipping navigation test');

      return;
    }

    await firstTeamLink.click();
    await expect(page).toHaveURL(/\/dashboard\/teams\/\w+/);
  });

  test('"Create" link navigates to /dashboard/teams/create', async ({
    page,
  }) => {
    const createLink = page.getByRole('link', { name: /create/i });

    await expect(createLink).toBeVisible();
    await createLink.click();
    await expect(page).toHaveURL(/\/dashboard\/teams\/create/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Create Team page
// ---------------------------------------------------------------------------

test.describe('Teams create — authenticated', () => {
  // Navigate via teams list so history exists for router.back()
  test.beforeEach(async ({ page }) => {
    await page.goto(TEAMS_URL);
    await expect(page.getByRole('heading', { name: /^teams$/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.goto(TEAMS_CREATE_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: /team/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders form with name field', async ({ page }) => {
    // The team form has a "Name" or "Team name" label
    const nameField = page.getByLabel(/name/i).first();

    await expect(nameField).toBeVisible();
  });

  test('"Back" button is visible on create page', async ({ page }) => {
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('"Back" button navigates back to teams list', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/teams/);
  });
});
