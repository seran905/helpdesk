import type { FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

export default async function globalSetup(_config: FullConfig) {
  const serverDir = path.resolve(__dirname, '../server');
  const testEnv = dotenv.parse(
    fs.readFileSync(path.join(serverDir, '.env.test')),
  );
  const env = { ...process.env, ...testEnv };

  execSync('npx prisma migrate deploy', { cwd: serverDir, env, stdio: 'inherit' });
  execSync('npm run seed', { cwd: serverDir, env, stdio: 'inherit' });
  // E2E-only fixture: an agent-role user, needed to exercise role gating
  // (server/prisma/seed.ts intentionally only creates a single admin user).
  execSync('npx tsx prisma/seed-e2e-agent.ts', { cwd: serverDir, env, stdio: 'inherit' });
}
