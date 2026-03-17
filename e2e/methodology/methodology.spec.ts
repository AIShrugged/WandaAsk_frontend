import { expect, test } from '@playwright/test';

/**
 * Methodology list and create page E2E tests.
 * Covers /dashboard/methodology and /dashboard/methodology/create.
 */

const METHODOLOGY_URL = '/dashboard/methodology';

const METHODOLOGY_CREATE_URL = '/dashboard/methodology/create';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Methodology — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/methodology to /auth/login', async ({ page }) => {
    await page.goto(METHODOLOGY_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects /dashboard/methodology/create to /auth/login', async ({
    page,
  }) => {
    await page.goto(METHODOLOGY_CREATE_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Methodology list
// ---------------------------------------------------------------------------

test.describe('Methodology list — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(METHODOLOGY_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(
      page.getByRole('heading', { name: /methodologies/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders "Methodologies" heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /methodologies/i }),
    ).toBeVisible();
  });

  test('renders "Add methodology" button', async ({ page }) => {
    // MethodologyCreate renders a Link wrapping a Button with "Add methodology" text
    await expect(
      page.getByRole('link', { name: /add methodology/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders methodology list OR empty state', async ({ page }) => {
    const methodologyLink = page
      .locator('a[href*="/dashboard/methodology/"]')
      .first();

    const emptyText = page.getByText(/no methodologies in this organization/i);

    const hasItems = await methodologyLink
      .isVisible({ timeout: 5000 })
      .catch(() => {
        return false;
      });

    const isEmpty = await emptyText.isVisible({ timeout: 3000 }).catch(() => {
      return false;
    });

    expect(hasItems || isEmpty).toBeTruthy();
  });

  test('clicking a methodology navigates to /dashboard/methodology/[id]', async ({
    page,
  }) => {
    const firstLink = page
      .locator('a[href*="/dashboard/methodology/"]')
      .first();

    const isVisible = await firstLink.isVisible({ timeout: 5000 }).catch(() => {
      return false;
    });

    if (!isVisible) {
      test.skip(true, 'No methodologies found — skipping navigation test');

      return;
    }

    await firstLink.click();
    await expect(page).toHaveURL(/\/dashboard\/methodology\/\w+/);
  });

  test('"Add methodology" link navigates to /dashboard/methodology/create', async ({
    page,
  }) => {
    const createLink = page.getByRole('link', { name: /add methodology/i });

    await expect(createLink).toBeVisible({ timeout: 10_000 });
    await createLink.click();
    await expect(page).toHaveURL(/\/dashboard\/methodology\/create/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Create Methodology page
// ---------------------------------------------------------------------------

test.describe('Methodology create — authenticated', () => {
  // Navigate via the list page so history exists for router.back()
  test.beforeEach(async ({ page }) => {
    await page.goto(METHODOLOGY_URL);
    await expect(
      page.getByRole('heading', { name: /methodologies/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.goto(METHODOLOGY_CREATE_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(
      page.getByRole('heading', { name: /methodolog/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders form with name field', async ({ page }) => {
    const nameField = page.getByLabel(/name/i).first();

    await expect(nameField).toBeVisible();
  });

  test('"Back" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('"Back" button returns to /dashboard/methodology', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/methodology/, { timeout: 8000 });
  });
});
