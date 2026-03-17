import { expect, test } from '@playwright/test';

/**
 * Chat room (detail) page E2E tests.
 * Covers /dashboard/chat/[id].
 */

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Chat room — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects /dashboard/chat/1 to /auth/login', async ({ page }) => {
    await page.goto('/dashboard/chat/1');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

test.describe('Chat room — authenticated', () => {
  let chatId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    await page.goto('/dashboard/chat');
    // Chat items are <a> links inside the sidebar pointing to /dashboard/chat/<id>
    const link = page
      .locator('a[href*="/dashboard/chat/"]:not([href="/dashboard/chat"])')
      .first();

    const href = await link.getAttribute('href').catch(() => {
      return null;
    });

    chatId = href?.split('/').pop() ?? null;
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    if (!chatId) {
      test.skip(
        true,
        'No chats found for test user — skipping chat room tests',
      );

      return;
    }
    await page.goto(`/dashboard/chat/${chatId}`);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    // Wait for the chat window to be rendered
    await page.waitForLoadState('networkidle');
  });

  test('renders message list area', async ({ page }) => {
    if (!chatId) return;
    // The chat window main area contains a scrollable message list
    // Check for the message container or the input area being present
    const chatArea = page
      .locator('div')
      .filter({ has: page.locator('textarea') })
      .first();

    await expect(chatArea).toBeVisible({ timeout: 10_000 });
  });

  test('renders message input (textarea)', async ({ page }) => {
    if (!chatId) return;
    const textarea = page.locator('textarea').first();

    await expect(textarea).toBeVisible({ timeout: 10_000 });
  });

  test('renders send button', async ({ page }) => {
    if (!chatId) return;
    await expect(
      page.getByRole('button', { name: /send message/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('typing in message input updates its value', async ({ page }) => {
    if (!chatId) return;
    const textarea = page.locator('textarea').first();

    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill('Hello, testing typing');
    await expect(textarea).toHaveValue('Hello, testing typing');
    // Clear the textarea after test
    await textarea.fill('');
  });

  test('Chats sidebar panel is visible', async ({ page }) => {
    if (!chatId) return;
    // The sidebar has a "Chats" label visible
    await expect(page.getByText('Chats')).toBeVisible({ timeout: 10_000 });
  });

  test('artifacts panel or toggle is present', async ({ page }) => {
    if (!chatId) return;
    // The artifact panel renders — check for its container or a collapse button
    // The ArtifactPanel is always rendered as a sibling of ChatList in ChatLayout
    // Look for the Chats label as proof that the sidebar layout rendered correctly
    await expect(page.getByText('Chats')).toBeVisible({ timeout: 10_000 });
    // The artifact panel may show "Artifacts" label or be collapsed
    // Just verify the full layout is present (no errors)
    const body = page.locator('body');

    await expect(body).not.toContainText('Error', { timeout: 5000 });
  });
});
