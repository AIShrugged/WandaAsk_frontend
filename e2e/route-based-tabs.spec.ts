import { expect, test } from '@playwright/test';

/**
 * Route-based tab navigation E2E tests.
 *
 * Covers:
 * - /dashboard/agents  → redirects to /dashboard/agents/tasks
 * - Agents tab strip: Tasks / Profiles / Activity links are visible and navigable
 * - /dashboard/main    → redirects to /dashboard/main/overview
 * - Main tab strip: Main / Statistics links are visible and navigable
 * - /dashboard/issues  → redirects to /dashboard/issues/list
 * - Issues tab strip: Tasktracker / Kanban links visible; Kanban preserves search params
 * - Direct URL /dashboard/main/statistics loads without redirect loop
 * - Direct URL /dashboard/issues/kanban loads without redirect loop
 * - /dashboard/kanban (legacy) → redirects to /dashboard/issues/kanban
 */

// ---------------------------------------------------------------------------
// Agents section
// ---------------------------------------------------------------------------

test.describe('Agents — route-based tabs', () => {
  test('/dashboard/agents redirects to /dashboard/agents/tasks', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents');
    await expect(page).toHaveURL(/\/dashboard\/agents\/tasks/, {
      timeout: 8000,
    });
  });

  test('Tasks, Profiles, and Activity tab links are visible on agents page', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents/tasks');

    await expect(page.getByRole('link', { name: /^tasks$/i })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole('link', { name: /^profiles$/i })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole('link', { name: /^activity$/i })).toBeVisible({
      timeout: 8000,
    });
  });

  test('clicking Profiles tab navigates to /dashboard/agents/profiles', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents/tasks');
    const profilesLink = page.getByRole('link', { name: /^profiles$/i });
    await expect(profilesLink).toBeVisible({ timeout: 8000 });
    await profilesLink.click();
    await expect(page).toHaveURL(/\/dashboard\/agents\/profiles/, {
      timeout: 8000,
    });
  });

  test('clicking Activity tab navigates to /dashboard/agents/activity', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents/tasks');
    const activityLink = page.getByRole('link', { name: /^activity$/i });
    await expect(activityLink).toBeVisible({ timeout: 8000 });
    await activityLink.click();
    await expect(page).toHaveURL(/\/dashboard\/agents\/activity/, {
      timeout: 8000,
    });
  });

  test('clicking Tasks tab from Profiles navigates back to /dashboard/agents/tasks', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents/profiles');
    const tasksLink = page.getByRole('link', { name: /^tasks$/i });
    await expect(tasksLink).toBeVisible({ timeout: 8000 });
    await tasksLink.click();
    await expect(page).toHaveURL(/\/dashboard\/agents\/tasks/, {
      timeout: 8000,
    });
  });

  test('Agents page header is visible', async ({ page }) => {
    await page.goto('/dashboard/agents/tasks');
    await expect(page.getByRole('heading', { name: /agents/i })).toBeVisible({
      timeout: 8000,
    });
  });

  test('direct URL /dashboard/agents/tasks loads correctly', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents/tasks');
    await expect(page).toHaveURL(/\/dashboard\/agents\/tasks/);
    // Should not bounce to login or cause a redirect loop
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('direct URL /dashboard/agents/profiles loads correctly', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents/profiles');
    await expect(page).toHaveURL(/\/dashboard\/agents\/profiles/);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Main dashboard section
// ---------------------------------------------------------------------------

test.describe('Main dashboard — route-based tabs', () => {
  test('/dashboard/main redirects to /dashboard/main/overview', async ({
    page,
  }) => {
    await page.goto('/dashboard/main');
    await expect(page).toHaveURL(/\/dashboard\/main\/overview/, {
      timeout: 8000,
    });
  });

  test('Main and Statistics tab links are visible on the main dashboard', async ({
    page,
  }) => {
    await page.goto('/dashboard/main/overview');

    await expect(page.getByRole('link', { name: /^main$/i })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole('link', { name: /^statistics$/i })).toBeVisible(
      { timeout: 8000 },
    );
  });

  test('clicking Statistics tab navigates to /dashboard/main/statistics', async ({
    page,
  }) => {
    await page.goto('/dashboard/main/overview');
    // Wait for the client-side tab nav to hydrate before clicking.
    // The DashboardTabsNav is a 'use client' component that briefly detaches
    // during React hydration — waitForLoadState('domcontentloaded') ensures the
    // initial paint is done but we also wait for the link to be stable.
    await page
      .waitForLoadState('networkidle', { timeout: 15_000 })
      .catch(() => {
        // networkidle may not fire for streaming pages; continue anyway
      });
    const statisticsLink = page.getByRole('link', {
      name: /^statistics$/i,
    });
    await expect(statisticsLink).toBeVisible({ timeout: 8000 });
    await statisticsLink.click();
    await expect(page).toHaveURL(/\/dashboard\/main\/statistics/, {
      timeout: 8000,
    });
  });

  test('clicking Main tab from Statistics navigates back to /dashboard/main/overview', async ({
    page,
  }) => {
    await page.goto('/dashboard/main/statistics');
    await page
      .waitForLoadState('networkidle', { timeout: 15_000 })
      .catch(() => {
        // continue regardless
      });
    const mainLink = page.getByRole('link', { name: /^main$/i });
    await expect(mainLink).toBeVisible({ timeout: 8000 });
    await mainLink.click();
    await expect(page).toHaveURL(/\/dashboard\/main\/overview/, {
      timeout: 8000,
    });
  });

  test('direct URL /dashboard/main/statistics loads correctly without redirect loop', async ({
    page,
  }) => {
    await page.goto('/dashboard/main/statistics');
    await expect(page).toHaveURL(/\/dashboard\/main\/statistics/);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('direct URL /dashboard/main/overview loads correctly', async ({
    page,
  }) => {
    await page.goto('/dashboard/main/overview');
    await expect(page).toHaveURL(/\/dashboard\/main\/overview/);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Issues / Kanban section
// ---------------------------------------------------------------------------

test.describe('Issues — route-based tabs', () => {
  test('/dashboard/issues redirects to /dashboard/issues/list', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues');
    await expect(page).toHaveURL(/\/dashboard\/issues\/list/, {
      timeout: 8000,
    });
  });

  test('Tasktracker and Kanban tab links are visible on the issues page', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues/list');
    // IssuesLayoutClient is a 'use client' component — wait for hydration
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('link', { name: /^tasktracker$/i }),
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /^kanban$/i })).toBeVisible({
      timeout: 8000,
    });
  });

  test('clicking Kanban tab navigates to /dashboard/issues/kanban', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues/list');
    // Wait for IssuesLayoutClient to hydrate (it fires a router.replace on mount
    // to clean stale URL params, which may cause the tab nav to briefly re-render)
    const kanbanLink = page.getByRole('link', { name: /^kanban$/i });
    await expect(kanbanLink).toBeVisible({ timeout: 8000 });
    // Use waitForNavigation in parallel with click to ensure the click lands
    await Promise.all([
      page.waitForURL(/\/dashboard\/issues\/kanban/, { timeout: 8000 }),
      kanbanLink.click(),
    ]);
  });

  test('clicking Tasktracker tab from Kanban navigates back to /dashboard/issues/list', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues/kanban');
    const tasktrackerLink = page.getByRole('link', { name: /^tasktracker$/i });
    await expect(tasktrackerLink).toBeVisible({ timeout: 8000 });
    await Promise.all([
      page.waitForURL(/\/dashboard\/issues\/list/, { timeout: 8000 }),
      tasktrackerLink.click(),
    ]);
  });

  test('Kanban tab preserves search params when switching from list', async ({
    page,
  }) => {
    // Visit the list tab with a filter param
    await page.goto('/dashboard/issues/list?status=open');
    const kanbanLink = page.getByRole('link', { name: /^kanban$/i });
    await expect(kanbanLink).toBeVisible({ timeout: 8000 });
    // Switch to Kanban — the IssuesTabsNav appends current search params to the href
    await Promise.all([
      page.waitForURL(/\/dashboard\/issues\/kanban/, { timeout: 8000 }),
      kanbanLink.click(),
    ]);
    // URL should include both the kanban segment and the filter
    await expect(page).toHaveURL(/status=open/);
  });

  test('Tasktracker tab preserves search params when switching from kanban', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues/kanban?status=open');
    const tasktrackerLink = page.getByRole('link', { name: /^tasktracker$/i });
    await expect(tasktrackerLink).toBeVisible({ timeout: 8000 });
    await Promise.all([
      page.waitForURL(/\/dashboard\/issues\/list/, { timeout: 8000 }),
      tasktrackerLink.click(),
    ]);
    await expect(page).toHaveURL(/status=open/);
  });

  test('direct URL /dashboard/issues/kanban loads correctly without redirect loop', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues/kanban');
    await expect(page).toHaveURL(/\/dashboard\/issues\/kanban/);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('direct URL /dashboard/issues/list loads correctly', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues/list');
    await expect(page).toHaveURL(/\/dashboard\/issues\/list/);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('Issues page header "Tasktracker" is visible', async ({ page }) => {
    await page.goto('/dashboard/issues/list');
    await expect(
      page.getByRole('heading', { name: /tasktracker/i }),
    ).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Legacy /dashboard/kanban redirect
// ---------------------------------------------------------------------------

test.describe('Legacy /dashboard/kanban redirect', () => {
  test('/dashboard/kanban redirects to /dashboard/issues/kanban', async ({
    page,
  }) => {
    await page.goto('/dashboard/kanban');
    await expect(page).toHaveURL(/\/dashboard\/issues\/kanban/, {
      timeout: 8000,
    });
  });
});

// ---------------------------------------------------------------------------
// Unauthenticated access
// ---------------------------------------------------------------------------

test.describe('Route-based tabs — unauthenticated access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated /dashboard/agents redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /dashboard/agents/tasks redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/agents/tasks');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /dashboard/main redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/main');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /dashboard/main/statistics redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/main/statistics');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /dashboard/issues redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /dashboard/issues/kanban redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/issues/kanban');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /dashboard/kanban redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard/kanban');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
