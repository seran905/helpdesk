import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test workers run as separate processes from the one that loads
// playwright.config.ts, so re-point at the test DB here too (same pattern as
// playwright.config.ts) before importing the server's Prisma client, which
// reads DATABASE_URL at import time.
loadEnv({ path: path.resolve(__dirname, "../../server/.env.test"), override: true });

const { prisma } = await import("../../server/src/lib/prisma.js");

/**
 * Deletes a user (and, via FK cascade, their sessions/accounts) created by a
 * test — used to keep the shared `helpdesk_test` database from accumulating
 * rows created by AddUserPage E2E tests across runs.
 */
export async function deleteUserByEmail(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}
