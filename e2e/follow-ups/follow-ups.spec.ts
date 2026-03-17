import { expect, test } from '@playwright/test';

/**
 * Follow-ups E2E tests.
 * Covers /dashboard/follow-ups (team list), /dashboard/follow-ups/[id] (follow-up list),
 * and /dashboard/follow-ups/analysis/[id] (analysis detail).
 */

const FOLLOW_UPS_URL = '/dashboard/follow-ups';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Follow-ups — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/follow-ups to /auth/login', async ({ page }) => {
    await page.goto(FOLLOW_UPS_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects /dashboard/follow-ups/1 to /auth/login', async ({ page }) => {
    await page.goto('/dashboard/follow-ups/1');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Follow-ups list (team list page)
// ---------------------------------------------------------------------------

test.describe('Follow-ups list — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FOLLOW_UPS_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: /teams/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders "Teams" heading on follow-ups page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /teams/i })).toBeVisible();
  });

  test('renders team list or empty state', async ({ page }) => {
    const teamLink = page
      .locator(
        'a[href*="/dashboard/follow-ups/"]:not([href="/dashboard/follow-ups"])',
      )
      .first();

    // Multiple empty state variants used across different scenarios
    const emptyText1 = page.getByText(/no team in this organization/i);

    const emptyText2 = page.getByText(/no teams yet/i);

    const emptyText3 = page.getByText(/create a team to get started/i);

    const hasTeams = await teamLink.isVisible({ timeout: 5000 }).catch(() => {
      return false;
    });

    const isEmpty1 = await emptyText1.isVisible({ timeout: 2000 }).catch(() => {
      return false;
    });

    const isEmpty2 = await emptyText2.isVisible({ timeout: 2000 }).catch(() => {
      return false;
    });

    const isEmpty3 = await emptyText3.isVisible({ timeout: 2000 }).catch(() => {
      return false;
    });

    expect(hasTeams || isEmpty1 || isEmpty2 || isEmpty3).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Follow-ups detail page (/dashboard/follow-ups/[teamId])
// ---------------------------------------------------------------------------

test.describe('Follow-ups detail — authenticated', () => {
  let teamId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
      baseURL: 'http://localhost:8080',
    });

    const page = await context.newPage();

    try {
      await page.goto(FOLLOW_UPS_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const teamLink = page
        .locator(
          'a[href*="/dashboard/follow-ups/"]:not([href="/dashboard/follow-ups"])',
        )
        .first();

      const href = await teamLink
        .getAttribute('href', { timeout: 5000 })
        .catch(() => {
          return null;
        });

      teamId = href?.split('/').pop() ?? null;
    } catch {
      // No teams found
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!teamId) {
      test.skip(true, 'No teams found in follow-ups — skipping detail tests');

      return;
    }
    // Build history for back navigation
    await page.goto(FOLLOW_UPS_URL, { waitUntil: 'domcontentloaded' });
    await page.goto(`/dashboard/follow-ups/${teamId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await page.waitForTimeout(500);
  });

  test('renders "Follow ups" heading', async ({ page }) => {
    if (!teamId) return;
    await expect(page.getByRole('heading', { name: /follow up/i })).toBeVisible(
      { timeout: 10_000 },
    );
  });

  test('renders follow-up list or empty state', async ({ page }) => {
    if (!teamId) return;
    const followUpItem = page
      .locator('a[href*="/dashboard/follow-ups/analysis/"]')
      .first();

    const emptyHeading = page.getByText(/no follow-ups yet/i);

    const hasItems = await followUpItem
      .isVisible({ timeout: 5000 })
      .catch(() => {
        return false;
      });

    const isEmpty = await emptyHeading
      .isVisible({ timeout: 3000 })
      .catch(() => {
        return false;
      });

    expect(hasItems || isEmpty).toBeTruthy();
  });

  test('renders back button', async ({ page }) => {
    if (!teamId) return;
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('back button navigates to /dashboard/follow-ups', async ({ page }) => {
    if (!teamId) return;
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/follow-ups/, { timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Authenticated — Analysis page (/dashboard/follow-ups/analysis/[id])
// ---------------------------------------------------------------------------

test.describe('Follow-ups analysis — authenticated', () => {
  let analysisId: string | null = null;

  // eslint-disable-next-line max-statements
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
      baseURL: 'http://localhost:8080',
    });

    const page = await context.newPage();

    try {
      // Step 1: get first team
      await page.goto(FOLLOW_UPS_URL, { waitUntil: 'domcontentloaded' });
      // Wait briefly for React to hydrate
      await page.waitForTimeout(1500);

      const teamLink = page
        .locator(
          'a[href*="/dashboard/follow-ups/"]:not([href="/dashboard/follow-ups"])',
        )
        .first();

      const teamHref = await teamLink
        .getAttribute('href', { timeout: 5000 })
        .catch(() => {
          return null;
        });

      if (!teamHref) return;

      // Step 2: get first analysis from that team
      await page.goto(teamHref, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const analysisLink = page
        .locator('a[href*="/dashboard/follow-ups/analysis/"]')
        .first();

      // Use short timeout — if no analysis links exist, fail fast
      const analysisHref = await analysisLink
        .getAttribute('href', { timeout: 3000 })
        .catch(() => {
          return null;
        });

      if (analysisHref) {
        analysisId = analysisHref.split('/').pop() ?? null;
      }
    } catch {
      // No analysis items found
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!analysisId) {
      test.skip(true, 'No analysis items found — skipping analysis tests');

      return;
    }

    await page.goto(FOLLOW_UPS_URL, { waitUntil: 'domcontentloaded' });
    await page.goto(`/dashboard/follow-ups/analysis/${analysisId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await page.waitForTimeout(500);
  });

  test('renders analysis heading (meeting title)', async ({ page }) => {
    if (!analysisId) return;
    const heading = page.getByRole('heading').first();

    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('renders tab buttons (Overview, Follow-up)', async ({ page }) => {
    if (!analysisId) return;
    await expect(page.getByRole('button', { name: /overview/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: /follow-up/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders back button', async ({ page }) => {
    if (!analysisId) return;
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
