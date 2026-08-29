import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Read the same agent credentials server/prisma/seed-e2e-agent.ts uses,
// straight from server/.env.test, rather than hardcoding them here.
const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

const agentAuthFile = path.resolve(__dirname, '.auth/agent.json');

setup('authenticate as seeded agent', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(testEnv.AGENT_EMAIL);
  await page.getByLabel('Password').fill(testEnv.AGENT_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Welcome, Test Agent' })).toBeVisible();

  await page.context().storageState({ path: agentAuthFile });
});
