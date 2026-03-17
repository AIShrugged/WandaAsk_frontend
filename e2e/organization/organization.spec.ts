import { expect, test } from '@playwright/test';

/**
 * Organization E2E tests.
 * Covers /dashboard/organization/create and /dashboard/organization/[id].
 *
 * Note: There is no /dashboard/organization list page in the app.
 * The organization list is at /auth/organization (post-login onboarding).
 * The dashboard only has create and edit (by ID).
 */

const ORG_CREATE_URL = '/dashboard/organization/create';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Organization — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/organization/create to /auth/login', async ({
    page,
  }) => {
    await page.goto(ORG_CREATE_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects /dashboard/organization/1 to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/organization/1');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Create Organization page
// ---------------------------------------------------------------------------

test.describe('Organization create — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate from dashboard so history exists for back navigation
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.goto(ORG_CREATE_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(
      page.getByRole('heading', { name: /organization create/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders "Organization create" heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /organization create/i }),
    ).toBeVisible();
  });

  test('renders back button', async ({ page }) => {
    // Two back buttons exist: header arrow + form "Back" link
    await expect(
      page.getByRole('button', { name: /back/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders form with name field', async ({ page }) => {
    const nameField = page.getByLabel(/name/i).first();

    await expect(nameField).toBeVisible({ timeout: 10_000 });
  });

  test('save button is disabled on empty form', async ({ page }) => {
    // Button is disabled when form is not dirty (!isDirty)
    const saveBtn = page.getByRole('button', { name: /save/i }).first();

    await expect(saveBtn).toBeDisabled({ timeout: 10_000 });
  });

  test('save button becomes enabled after filling name', async ({ page }) => {
    const nameField = page.getByLabel(/name/i).first();

    const saveBtn = page.getByRole('button', { name: /save/i }).first();

    await nameField.fill('Test Organization Name');
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Organization edit page (/dashboard/organization/[id])
// ---------------------------------------------------------------------------

test.describe('Organization edit — authenticated', () => {
  let orgId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(30_000);
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
      baseURL: 'http://localhost:8080',
    });

    const page = await context.newPage();

    try {
      // The organization selector in the topbar links to /dashboard/organization/[id]
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Look for any organization-related links in the page
      const orgLink = page
        .locator('a[href*="/dashboard/organization/"]:not([href*="/create"])')
        .first();

      const href = await orgLink
        .getAttribute('href', { timeout: 5000 })
        .catch(() => {
          return null;
        });

      if (href) {
        orgId = href.split('/').pop() ?? null;
      }
    } catch {
      // Could not find org ID
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!orgId) {
      test.skip(true, 'No organization link found — skipping org detail tests');

      return;
    }
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.goto(`/dashboard/organization/${orgId}`);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await page.waitForTimeout(500);
  });

  test('renders "Organization settings" heading', async ({ page }) => {
    if (!orgId) return;
    await expect(
      page.getByRole('heading', { name: /organization settings/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders back button', async ({ page }) => {
    if (!orgId) return;
    await expect(
      page.getByRole('button', { name: /back/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders name field pre-filled', async ({ page }) => {
    if (!orgId) return;
    const nameField = page.getByLabel(/name/i).first();

    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await expect(nameField).not.toHaveValue('');
  });
});
