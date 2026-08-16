import { test, expect } from '@playwright/test';
import path from 'node:path';

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');

test.use({ storageState: adminAuthFile });

test.describe('Sign out', () => {
  test('clicking Sign out clears the session and redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('after signing out, navigating to / again redirects back to /login instead of showing stale UI', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');

    // Direct navigation back to a protected route after sign-out (equivalent
    // in effect to the browser back button landing on a stale protected
    // page: either way the app must re-check the session and bounce to
    // /login rather than render cached authenticated UI).
    await page.goto('/');

    await expect(page).toHaveURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
