import { test, expect, type Page } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

// Signing out actually invalidates the session server-side, so this spec
// must not reuse the shared e2e/.auth/admin.json storageState — every other
// admin-authenticated spec (protected-routes, session-edge-cases,
// user-management) depends on that session staying valid for the whole e2e
// run. Logging in fresh here, the same way login.spec.ts does, means this
// spec only ever destroys a session of its own.
test.use({ storageState: { cookies: [], origins: [] } });

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(testEnv.ADMIN_EMAIL);
  await page.getByLabel('Password').fill(testEnv.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();
}

test.describe('Sign out', () => {
  test('clicking Sign out clears the session and redirects to /login', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('after signing out, navigating to / again redirects back to /login instead of showing stale UI', async ({
    page,
  }) => {
    await loginAsAdmin(page);

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
