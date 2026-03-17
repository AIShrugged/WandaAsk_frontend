import type { Page } from '@playwright/test';

/**
 * Navigates to a list page and extracts the ID from the first resource link
 * whose href matches the given prefix pattern.
 * Returns null if no items exist.
 * @param page - Playwright Page object.
 * @param listUrl - URL of the list page to navigate to.
 * @param hrefPrefix - String prefix that the link href should contain (e.g. '/dashboard/chat/').
 * @returns The last segment of the href (the ID), or null if not found.
 */
export async function getFirstId(
  page: Page,
  listUrl: string,
  hrefPrefix: string,
): Promise<string | null> {
  await page.goto(listUrl);
  const link = page.locator(`a[href*="${hrefPrefix}"]`).first();

  const href = await link.getAttribute('href').catch(() => {
    return null;
  });

  if (!href) return null;

  return href.split('/').pop() ?? null;
}

/**
 * Clears an input via keyboard to reliably trigger react-hook-form onChange.
 * Playwright's fill('') does not always dispatch synthetic React events.
 * @param page - Playwright Page object.
 * @param locator - Locator for the input to clear.
 */
export async function clearInput(
  page: Page,
  locator: import('@playwright/test').Locator,
): Promise<void> {
  await locator.click();
  await locator.selectText();
  await page.keyboard.press('Backspace');
}
