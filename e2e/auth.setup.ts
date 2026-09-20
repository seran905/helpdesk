import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Read the same admin credentials the seed script uses, straight from
// server/.env.test, rather than hardcoding them here.
const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');

setup('authenticate as seeded admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(testEnv.ADMIN_EMAIL);
  await page.getByLabel('Password').fill(testEnv.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: /^Welcome, / })).toBeVisible();

  await page.context().storageState({ path: adminAuthFile });
});
