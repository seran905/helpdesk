import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, 'server/.env.test')),
);

// Dedicated ports for e2e, distinct from the normal dev ports (3001/5173),
// so the suite never has to fight over a port with a manually-running dev
// server. DB isolation still comes entirely from testEnv's DATABASE_URL.
// The server's origin/port is read from TEST_API_URL in server/.env.test
// (the single source of truth e2e specs that hit the server directly also
// read from), rather than hardcoded here and duplicated in those specs.
const testServerUrl = testEnv.TEST_API_URL;
const TEST_SERVER_PORT = new URL(testServerUrl).port;
const TEST_CLIENT_PORT = 4173;
const testClientUrl = `http://localhost:${TEST_CLIENT_PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { outputFolder: './e2e/playwright-report' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: testClientUrl,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      name: 'server',
      command: 'npm run dev',
      cwd: './server',
      url: `${testServerUrl}/api/health`,
      env: {
        ...testEnv,
        PORT: String(TEST_SERVER_PORT),
        CLIENT_URL: testClientUrl,
        BETTER_AUTH_URL: testServerUrl,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      name: 'client',
      // --strictPort: fail instead of silently falling back to another port
      // if TEST_CLIENT_PORT is somehow taken (same gotcha CLAUDE.md documents
      // for the normal 5173 dev port, applied here too).
      command: `npm run dev -- --port ${TEST_CLIENT_PORT} --strictPort`,
      cwd: './client',
      url: testClientUrl,
      env: {
        VITE_API_URL: testServerUrl,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
