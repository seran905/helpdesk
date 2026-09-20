import { test, expect } from '@playwright/test';
import path from 'node:path';

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');

const SESSION_COOKIE_NAME = 'better-auth.session_token';

// The session cookie is issued by the server (the client fetches
// VITE_API_URL directly, cross-origin, with credentials included — see
// CLAUDE.md's CLIENT_URL/CORS gotcha), so it belongs to the server's origin,
// not the client baseURL configured in playwright.config.ts. 4001 is the
// dedicated e2e server port hardcoded there as TEST_SERVER_PORT.
const API_URL = 'http://localhost:4001';

test.describe('Session cookie shape', () => {
  test.use({ storageState: adminAuthFile });

  test('the session cookie is HttpOnly with SameSite=Lax', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome, Admin' })).toBeVisible();

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe('Lax');
  });
});

test.describe('Tampered session cookie', () => {
  // Starts from a fresh, unauthenticated context — deliberately not using
  // adminAuthFile, since this test installs its own (garbage) cookie.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a garbage session token is treated as "no session", not a crash', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: 'this-is-not-a-real-session-token',
        url: API_URL,
      },
    ]);

    await page.goto('/');

    await expect(page).toHaveURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
