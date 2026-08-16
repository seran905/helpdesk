import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, 'server/.env.test')),
);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      name: 'server',
      command: 'npm run dev',
      cwd: './server',
      url: 'http://localhost:3001/api/health',
      env: testEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      name: 'client',
      command: 'npm run dev',
      cwd: './client',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
