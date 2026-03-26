import { expect, test } from '@playwright/test';

/**
 * Chat list page E2E tests.
 * Covers /dashboard/chat — the chat sidebar list and empty state.
 */

const CHAT_URL = '/dashboard/chat';

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Chat list — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/chat to /auth/login', async ({ page }) => {
    await page.goto(CHAT_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated — structure
// ---------------------------------------------------------------------------

test.describe('Chat list — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CHAT_URL);
    // Wait for the page content to settle
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('renders Chats sidebar label', async ({ page }) => {
    // The chat sidebar has a "Chats" span label
    await expect(page.getByText('Chats')).toBeVisible({ timeout: 10_000 });
  });

  test('renders "New" button (new chat CTA)', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new chat/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows empty state or chat items', async ({ page }) => {
    // Wait for loading skeleton to finish — sidebar must show "Chats" label first
    await expect(page.getByText('Chats')).toBeVisible({ timeout: 15_000 });

    // Either shows a chat item link or the empty state text
    const chatLink = page
      .locator('a[href*="/dashboard/chat/"]:not([href="/dashboard/chat"])')
      .first();
    const emptyState = page.getByText(/no chats yet/i);
    const hasChats = await chatLink.isVisible({ timeout: 5000 }).catch(() => {
      return false;
    });
    const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => {
      return false;
    });

    expect(hasChats || isEmpty).toBeTruthy();
  });

  test('renders "Select a chat" empty state when no chat is selected', async ({
    page,
  }) => {
    // The right panel always shows this text on /dashboard/chat (no chat selected)
    await expect(
      page.getByText(/select a chat or create a new one/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  test('clicking a chat item navigates to /dashboard/chat/[id]', async ({
    page,
  }) => {
    const link = page
      .locator('a[href*="/dashboard/chat/"]:not([href="/dashboard/chat"])')
      .first();
    const isVisible = await link.isVisible({ timeout: 5000 }).catch(() => {
      return false;
    });

    if (!isVisible) {
      test.skip(true, 'No chat items found — skipping navigation test');

      return;
    }

    const href = await link.getAttribute('href');

    await link.click();

    await expect(page).toHaveURL(
      new RegExp(href!.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)),
      { timeout: 8000 },
    );
  });

  test('"New" button creates chat and navigates to chat room', async ({
    page,
  }) => {
    const newBtn = page.getByRole('button', { name: /new chat/i });

    await expect(newBtn).toBeVisible({ timeout: 10_000 });
    await newBtn.click();
    // After creating a new chat, should navigate to /dashboard/chat/[id]
    await expect(page).toHaveURL(/\/dashboard\/chat\/\d+/, { timeout: 15_000 });
  });
});
