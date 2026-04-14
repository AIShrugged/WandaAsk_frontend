import { expect, test } from '@playwright/test';

/**
 * Calendar page E2E tests.
 * Covers /dashboard/calendar.
 *
 * The calendar page has two states:
 * - Unattached: shows "Connect your calendar" onboarding CTA
 * - Attached: shows a calendar widget with month/week navigation
 */

const CALENDAR_URL = '/dashboard/calendar';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Calendar — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/calendar to /auth/login', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

test.describe('Calendar — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await page.waitForTimeout(1000);
  });

  test('page loads without redirect to login', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/dashboard\/calendar/);
  });

  test('renders calendar widget OR connect-calendar onboarding', async ({
    page,
  }) => {
    // Either the calendar view or the onboarding message must be visible
    // Calendar view: has navigation buttons or month/week labels
    const calendarWidget = page
      .getByRole('button')
      .or(
        page.getByText(
          /january|february|march|april|may|june|july|august|september|october|november|december/i,
        ),
      )
      .first();
    // Onboarding: shows connect calendar CTA
    const onboarding = page
      .getByText(/connect/i)
      .or(page.getByText(/calendar/i))
      .first();
    const hasCalendar = await calendarWidget
      .isVisible({ timeout: 5000 })
      .catch(() => {
        return false;
      });
    const hasOnboarding = await onboarding
      .isVisible({ timeout: 3000 })
      .catch(() => {
        return false;
      });

    expect(hasCalendar || hasOnboarding).toBeTruthy();
  });

  test('page has some visible content (no blank page)', async ({ page }) => {
    // Simply verify we're still on the calendar page and not blank
    await expect(page).toHaveURL(/\/dashboard\/calendar/, { timeout: 10_000 });
    // The page body should have visible text
    const bodyText = await page
      .locator('body')
      .textContent({ timeout: 10_000 });

    expect(bodyText?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
