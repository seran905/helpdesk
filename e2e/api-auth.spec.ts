import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');
const agentAuthFile = path.resolve(__dirname, '.auth/agent.json');

// These tests hit the server directly rather than through the client, so
// they need the server's own origin, not the client baseURL configured in
// playwright.config.ts (`use.baseURL`, which points at the client on 4173).
// 4001 is the dedicated e2e server port hardcoded in playwright.config.ts's
// TEST_SERVER_PORT.
const API_URL = 'http://localhost:4001';

test.describe('GET /api/me — unauthenticated', () => {
  test('returns 401 with an Unauthorized error body', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/me`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });
});

test.describe('GET /api/users — unauthenticated', () => {
  test('returns 401', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/users`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });
});

test.describe('Authenticated as admin', () => {
  test.use({ storageState: adminAuthFile });

  test('GET /api/me returns 200 with role admin', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/me`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.role).toBe('admin');
    expect(body.user.email).toBe(testEnv.ADMIN_EMAIL);
  });

  test('GET /api/users returns 200 and includes the seeded admin', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/users`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.some((u: { email: string }) => u.email === testEnv.ADMIN_EMAIL)).toBe(
      true,
    );
  });
});

test.describe('Authenticated as agent', () => {
  test.use({ storageState: agentAuthFile });

  test('GET /api/me returns 200 — agents can read their own info', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/me`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.role).toBe('agent');
    expect(body.user.email).toBe('agent@example.com');
  });

  test('GET /api/users returns 403 — admin-only list is forbidden to agents', async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/users`);

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });
});

test.describe('Sign-up is disabled server-side', () => {
  test('POST /api/auth/sign-up/email is rejected even with a plausible payload', async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: {
        name: 'Sneaky New User',
        email: `sneaky-${Date.now()}@example.com`,
        password: 'password123',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('EMAIL_PASSWORD_SIGN_UP_DISABLED');
  });
});

test.describe('Repeated failed logins in the e2e environment', () => {
  // Documents current e2e-environment behavior, not a general claim about
  // rate limiting: better-auth's rateLimit is gated on
  // `process.env.NODE_ENV === "production"` (server/src/lib/auth.ts), and
  // nothing in the e2e webServer env sets NODE_ENV, so the
  // 5-per-60s /sign-in/email rule doesn't apply here. If that gating ever
  // changes, this test would start failing on the 6th attempt and should be
  // revisited rather than silently adjusted to expect a 429.
  test('six rapid failed logins all get a plain 401, not a 429', async ({ request }) => {
    for (let i = 0; i < 6; i++) {
      const response = await request.post(`${API_URL}/api/auth/sign-in/email`, {
        data: { email: 'no-such-user@example.com', password: 'whatever-password' },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.code).toBe('INVALID_EMAIL_OR_PASSWORD');
    }
  });
});
