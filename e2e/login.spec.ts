import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

// These tests exercise the login form itself, so they must start from a
// fresh, unauthenticated browser context regardless of the 'chromium'
// project's dependency on the 'setup' project (which only produces a
// storageState file — it doesn't affect this file's own context).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login form validation', () => {
  test('empty submission shows required-field errors and does not call the sign-in API', async ({
    page,
  }) => {
    const signInRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/sign-in/email')) signInRequests.push(req.url());
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL('/login');
    expect(signInRequests).toHaveLength(0);
  });

  test('invalid email format shows a validation error and does not call the sign-in API', async ({
    page,
  }) => {
    const signInRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/sign-in/email')) signInRequests.push(req.url());
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill('some-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL('/login');
    expect(signInRequests).toHaveLength(0);
  });
});

test.describe('Login form server-side errors', () => {
  test('valid email with wrong password shows a server error and stays on /login', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(testEnv.ADMIN_EMAIL);
    await page.getByLabel('Password').fill('definitely-the-wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('non-existent email shows a server error and stays on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('no-such-user@example.com');
    await page.getByLabel('Password').fill('whatever-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Login form network failure', () => {
  test('an aborted sign-in request shows "Failed to reach the server"', async ({ page }) => {
    await page.route('**/sign-in/email', (route) => route.abort('failed'));

    await page.goto('/login');
    await page.getByLabel('Email').fill(testEnv.ADMIN_EMAIL);
    await page.getByLabel('Password').fill(testEnv.ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Failed to reach the server')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Login success', () => {
  test('valid credentials log in and redirect to / with a welcome message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(testEnv.ADMIN_EMAIL);
    await page.getByLabel('Password').fill(testEnv.ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();
  });
});
