import { expect, test } from '@playwright/test';

const PROFILE_URL = '/dashboard/profile';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clears an input via keyboard to reliably trigger react-hook-form onChange.
 * Playwright's fill('') does not always dispatch synthetic React events.
 * @param page
 * @param locator
 */
async function clearInput(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
) {
  await locator.click();
  await locator.selectText();
  await page.keyboard.press('Backspace');
}

/**
 * Returns locators for all profile page form fields and buttons.
 * @param page
 * @returns Locator object.
 */
function getLocators(page: import('@playwright/test').Page) {
  return {
    nameInput: page.getByLabel(/^name$/i),
    saveBtn: page.getByRole('button', { name: /save changes/i }),
    currentPasswordInput: page.getByLabel(/current password/i),
    // exact: true — prevents substring match with "Confirm new password"
    newPasswordInput: page.getByLabel('New password', { exact: true }),
    confirmPasswordInput: page.getByLabel(/confirm new password/i),
    changePasswordBtn: page.getByRole('button', { name: /change password/i }),
  };
}

// ---------------------------------------------------------------------------
// Unauthenticated
// ---------------------------------------------------------------------------

test.describe('Profile page — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects to /auth/login when not authenticated', async ({ page }) => {
    await page.goto(PROFILE_URL);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

test.describe('Profile page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROFILE_URL);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Page structure
  // -------------------------------------------------------------------------

  test('renders both form sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /account info/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /change password/i }),
    ).toBeVisible();
  });

  test('renders name pre-filled, no email field', async ({ page }) => {
    const { nameInput } = getLocators(page);

    await expect(nameInput).toBeVisible();
    await expect(nameInput).not.toHaveValue('');
    await expect(page.getByLabel(/^email$/i)).not.toBeVisible();
  });

  test('renders all three password fields', async ({ page }) => {
    const { currentPasswordInput, newPasswordInput, confirmPasswordInput } =
      getLocators(page);

    await expect(currentPasswordInput).toBeVisible();
    await expect(newPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Name change — button state
  // -------------------------------------------------------------------------

  test('Save button disabled on pristine form', async ({ page }) => {
    await expect(getLocators(page).saveBtn).toBeDisabled();
  });

  test('Save button enabled after editing name', async ({ page }) => {
    const { nameInput, saveBtn } = getLocators(page);

    await nameInput.fill('Updated Name');
    await expect(saveBtn).toBeEnabled();
  });

  // -------------------------------------------------------------------------
  // Name change — validation
  // -------------------------------------------------------------------------

  test('shows "Name is required" when name cleared and submitted', async ({
    page,
  }) => {
    const { nameInput, saveBtn } = getLocators(page);

    // Make dirty first so button becomes enabled
    await nameInput.fill('Temp');
    await expect(saveBtn).toBeEnabled();

    // Clear via keyboard to reliably trigger react-hook-form onChange
    await clearInput(page, nameInput);

    await saveBtn.click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Name change — success flow (real backend)
  // NOTE: ProfileForm does not call reset() after save, so isDirty stays true.
  // The form intentionally keeps the new value in the input after save.
  // -------------------------------------------------------------------------

  // eslint-disable-next-line max-statements
  test('shows success toast after saving name', async ({ page }) => {
    const { nameInput, saveBtn } = getLocators(page);
    // Use a fixed base name so repeated runs don't accumulate suffixes.
    const FIXED_BASE = 'E2E Test User';
    const TOAST_TIMEOUT = 15_000;

    // Step 1: Save the fixed base name (restores clean state if a prior run left it dirty).
    await nameInput.fill(FIXED_BASE);
    // If already equal to defaultValues the button stays disabled — skip in that case.
    const isEnabled = await saveBtn.isEnabled();

    if (isEnabled) {
      await saveBtn.click();
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible(
        {
          timeout: TOAST_TIMEOUT,
        },
      );
    }

    // Step 2: Save a modified name and assert toast.
    await page.reload();
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    const { nameInput: reloadedInput, saveBtn: reloadedBtn } =
      getLocators(page);

    await reloadedInput.fill(`${FIXED_BASE} Updated`);
    await expect(reloadedBtn).toBeEnabled();
    await reloadedBtn.click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({
      timeout: TOAST_TIMEOUT,
    });

    // Step 3: Restore to FIXED_BASE so next run starts clean.
    await page.reload();
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    const { nameInput: restoreInput, saveBtn: restoreBtn } = getLocators(page);

    await restoreInput.fill(FIXED_BASE);
    await expect(restoreBtn).toBeEnabled({ timeout: 5000 });
    await restoreBtn.click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({
      timeout: TOAST_TIMEOUT,
    });
  });

  // -------------------------------------------------------------------------
  // Password change — button state
  // -------------------------------------------------------------------------

  test('Change password button disabled on pristine form', async ({ page }) => {
    await expect(getLocators(page).changePasswordBtn).toBeDisabled();
  });

  test('Change password button enabled after filling any field', async ({
    page,
  }) => {
    const { currentPasswordInput, changePasswordBtn } = getLocators(page);

    // pressSequentially simulates real key presses, reliably triggering react-hook-form onChange
    await currentPasswordInput.pressSequentially('anyvalue');
    await expect(changePasswordBtn).toBeEnabled();
  });

  // -------------------------------------------------------------------------
  // Password change — client-side validation
  // -------------------------------------------------------------------------

  test('shows "Current password is required" when submitted without it', async ({
    page,
  }) => {
    const { newPasswordInput, confirmPasswordInput, changePasswordBtn } =
      getLocators(page);

    await newPasswordInput.fill('newpassword1');
    await confirmPasswordInput.fill('newpassword1');
    await changePasswordBtn.click();

    await expect(page.getByText(/current password is required/i)).toBeVisible();
  });

  test('shows "At least 8 characters" for short new password', async ({
    page,
  }) => {
    const { currentPasswordInput, newPasswordInput, changePasswordBtn } =
      getLocators(page);

    await currentPasswordInput.fill('currentpass');
    await newPasswordInput.fill('short');
    await changePasswordBtn.click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('shows "Passwords do not match" when confirmation differs', async ({
    page,
  }) => {
    const {
      currentPasswordInput,
      newPasswordInput,
      confirmPasswordInput,
      changePasswordBtn,
    } = getLocators(page);

    await currentPasswordInput.fill('currentpass');
    await newPasswordInput.fill('newpassword1');
    await confirmPasswordInput.fill('differentpass1');
    await changePasswordBtn.click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Password change — INVALID_CURRENT_PASSWORD (full E2E stack)
  //
  // Exercises the complete chain:
  //   browser → Server Action → backend → 422 INVALID_CURRENT_PASSWORD
  //   → setError('current_password') → error rendered under the field
  //
  // The error must appear inline (under the input), not only as a toast.
  // We verify this by checking the error is located inside the form, adjacent
  // to the current_password input.
  // -------------------------------------------------------------------------

  test('shows inline field error when current password is wrong', async ({
    page,
  }) => {
    const {
      currentPasswordInput,
      newPasswordInput,
      confirmPasswordInput,
      changePasswordBtn,
    } = getLocators(page);

    await currentPasswordInput.fill('definitely-wrong-password-xyz');
    await newPasswordInput.fill('newpassword1');
    await confirmPasswordInput.fill('newpassword1');
    await changePasswordBtn.click();

    // The error text must be visible on the page
    await expect(
      page.getByText(/current password is incorrect/i),
    ).toBeVisible();

    // It must appear inline — inside the div that wraps the current_password
    // input (not only as a floating Sonner toast outside the form)
    const fieldWrapper = page.locator('div:has(#current_password)');

    await expect(
      fieldWrapper.getByText(/current password is incorrect/i),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Visual regression
  // -------------------------------------------------------------------------

  test('profile page matches snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('profile-page.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
