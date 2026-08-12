import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Points the server webServer entry (and this config's own process) at the
// test database instead of the dev database — see server/.env.test.
loadEnv({ path: path.resolve(__dirname, "../server/.env.test"), override: true });

const SERVER_PORT = 3001;
const CLIENT_PORT = 5173;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      name: "server",
      command: "npm run dev",
      cwd: "../server",
      url: `http://localhost:${SERVER_PORT}/api/health`,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      name: "client",
      command: "npm run dev -- --port 5173 --strictPort",
      cwd: "../client",
      url: `http://localhost:${CLIENT_PORT}`,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
