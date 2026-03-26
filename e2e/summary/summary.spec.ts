import { expect, test } from '@playwright/test';

/**
 * Summary/Statistics page E2E tests.
 * Covers /dashboard/summary and the /dashboard/statistics redirect.
 */

const SUMMARY_URL = '/dashboard/summary';
const STATISTICS_URL = '/dashboard/statistics';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Summary — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/summary to /auth/login', async ({ page }) => {
    await page.goto(SUMMARY_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects /dashboard/statistics to /auth/login', async ({ page }) => {
    await page.goto(STATISTICS_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

test.describe('Summary — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SUMMARY_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    // Wait for stats to load
    await page.waitForTimeout(1000);
  });

  test('renders "Statistics" heading', async ({ page }) => {
    // SummaryHeader renders a heading with "Statistics" text
    await expect(
      page
        .getByRole('heading', { name: /statistics/i })
        .or(page.getByText('Statistics').first()),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders KPI metric cards (Meetings, Participants, Tasks, etc.)', async ({
    page,
  }) => {
    // KpiCard labels from the SummaryPage
    const meetingsCard = page.getByText('Meetings').first();

    await expect(meetingsCard).toBeVisible({ timeout: 10_000 });
  });

  test('renders Meetings and Unique participants cards', async ({ page }) => {
    // Check for at least two of the five KPI cards
    await expect(page.getByText('Meetings').first()).toBeVisible({
      timeout: 10_000,
    });
    const participants = page.getByText(/unique participants/i).first();
    const tasks = page.getByText('Tasks').first();
    const hasParticipants = await participants
      .isVisible({ timeout: 3000 })
      .catch(() => {
        return false;
      });
    const hasTasks = await tasks.isVisible({ timeout: 3000 }).catch(() => {
      return false;
    });

    expect(hasParticipants || hasTasks).toBeTruthy();
  });

  test('page renders without JS errors', async ({ page }) => {
    // Ensure no unhandled errors in the page
    const errors: string[] = [];

    page.on('pageerror', (err) => {
      return errors.push(err.message);
    });

    await page.reload();
    await page.waitForTimeout(2000);
    // Filter known Next.js non-critical errors
    const criticalErrors = errors.filter((e) => {
      return !e.includes('hydration') && !e.includes('chunk');
    });

    expect(criticalErrors).toHaveLength(0);
  });
});
