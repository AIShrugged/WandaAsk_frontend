import { expect, test } from '@playwright/test';

/**
 * Meeting detail page E2E tests.
 * Covers /dashboard/meeting/[id].
 *
 * Meeting IDs are extracted from the follow-ups team detail page.
 * If no meetings exist for the test user, all authenticated detail tests are skipped.
 */

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Meeting detail — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/meeting/1 to /auth/login', async ({ page }) => {
    await page.goto('/dashboard/meeting/1');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

test.describe('Meeting detail — authenticated', () => {
  let meetingId: string | null = null;

  // eslint-disable-next-line max-statements
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
      baseURL: 'http://localhost:8080',
    });

    const page = await context.newPage();

    try {
      // Step 1: Get first team from follow-ups
      await page.goto('/dashboard/follow-ups', {
        waitUntil: 'domcontentloaded',
      });
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

      if (!teamHref) {
        // No teams — no meetings to test
        return;
      }

      // Step 2: Get first follow-up analysis link from that team
      await page.goto(teamHref, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const analysisLink = page
        .locator('a[href*="/dashboard/follow-ups/analysis/"]')
        .first();

      const analysisHref = await analysisLink
        .getAttribute('href', { timeout: 3000 })
        .catch(() => {
          return null;
        });

      if (analysisHref) {
        meetingId = analysisHref.split('/').pop() ?? null;
      }
    } catch {
      // Could not find meeting — meetingId stays null, tests will skip
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!meetingId) {
      test.skip(
        true,
        'No meetings found for test user — skipping meeting detail tests',
      );

      return;
    }

    await page.goto(`/dashboard/meeting/${meetingId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).not.toHaveURL(/\/auth\/login/);
    // Brief pause for dynamic content
    await page.waitForTimeout(1000);
  });

  test('renders meeting title as heading', async ({ page }) => {
    if (!meetingId) return;
    const heading = page.getByRole('heading').first();

    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('renders back button', async ({ page }) => {
    if (!meetingId) return;
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders tab buttons (Overview, Follow-up, Transcript, Analysis)', async ({
    page,
  }) => {
    if (!meetingId) return;
    await expect(page.getByRole('button', { name: /overview/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: /follow-up/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: /transcript/i })).toBeVisible(
      { timeout: 10_000 },
    );
    await expect(page.getByRole('button', { name: /analysis/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('"Overview" tab is active by default', async ({ page }) => {
    if (!meetingId) return;
    const url = page.url();

    expect(url).not.toMatch(/tab=followup/);
    expect(url).not.toMatch(/tab=transcript/);
    expect(url).not.toMatch(/tab=analysis/);
  });

  test('clicking "Follow-up" tab updates URL with ?tab=followup', async ({
    page,
  }) => {
    if (!meetingId) return;
    const followUpBtn = page.getByRole('button', { name: /follow-up/i });

    await expect(followUpBtn).toBeVisible({ timeout: 10_000 });
    await followUpBtn.click();
    await expect(page).toHaveURL(/tab=followup/, { timeout: 8000 });
  });

  test('clicking "Transcript" tab updates URL with ?tab=transcript', async ({
    page,
  }) => {
    if (!meetingId) return;
    const transcriptBtn = page.getByRole('button', { name: /transcript/i });

    await expect(transcriptBtn).toBeVisible({ timeout: 10_000 });
    await transcriptBtn.click();
    await expect(page).toHaveURL(/tab=transcript/, { timeout: 8000 });
  });

  test('clicking "Analysis" tab updates URL with ?tab=analysis', async ({
    page,
  }) => {
    if (!meetingId) return;
    const analysisBtn = page.getByRole('button', { name: /analysis/i });

    await expect(analysisBtn).toBeVisible({ timeout: 10_000 });
    await analysisBtn.click();
    await expect(page).toHaveURL(/tab=analysis/, { timeout: 8000 });
  });
});
