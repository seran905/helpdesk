import { test, expect } from '@playwright/test';
import path from 'node:path';

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');
const agentAuthFile = path.resolve(__dirname, '.auth/agent.json');

test.describe('Unauthenticated session routing', () => {
  // No storageState override needed here: the 'chromium' project has no
  // default storageState, so these tests already start from a fresh,
  // logged-out browser context.

  test('direct navigation to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('direct navigation to /users redirects to /login', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Authenticated admin session routing', () => {
  test.use({ storageState: adminAuthFile });

  test('navigating to /login redirects away to / instead of showing the form', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(page).toHaveURL('/');
    await expect(page.getByLabel('Email')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();
  });

  test('admin sees the Users nav link and can reach /users directly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();

    await page.goto('/users');
    await expect(page).toHaveURL('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  test('session persists across a page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();
  });
});

test.describe('Agent role gating', () => {
  // Uses the e2e-only agent fixture from server/prisma/seed-e2e-agent.ts
  // (seeded in e2e/global-setup.ts) and the storageState saved by
  // e2e/agent-auth.setup.ts.
  test.use({ storageState: agentAuthFile });

  test('agent role does not see the Users nav link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Test Agent' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
  });

  test('agent navigating directly to /users is redirected away to /', async ({ page }) => {
    await page.goto('/users');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Test Agent' })).toBeVisible();
  });
});
