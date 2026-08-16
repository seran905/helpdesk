import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

// Fixed credentials from server/prisma/seed-e2e-agent.ts (an e2e-only
// fixture — there's no env var for these since they only ever exist in the
// isolated helpdesk_test database, unlike the admin creds in .env.test).
const AGENT_EMAIL = 'agent@example.com';
const AGENT_PASSWORD = 'password123';

const agentAuthFile = path.resolve(__dirname, '.auth/agent.json');

setup('authenticate as seeded agent', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(AGENT_EMAIL);
  await page.getByLabel('Password').fill(AGENT_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Welcome, Test Agent' })).toBeVisible();

  await page.context().storageState({ path: agentAuthFile });
});
