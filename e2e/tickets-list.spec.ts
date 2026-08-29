import { test, expect, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Same pattern as inbound-email-webhook.spec.ts: read the webhook secret and
// the server's own origin straight from server/.env.test rather than
// hardcoding either value here.
const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

const API_URL = testEnv.TEST_API_URL;
const WEBHOOK_PATH = `${API_URL}/api/webhooks/inbound-email`;
const WEBHOOK_SECRET_HEADER = testEnv.INBOUND_EMAIL_WEBHOOK_SECRET_HEADER;

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');
const agentAuthFile = path.resolve(__dirname, '.auth/agent.json');

function makePayload(suffix: string) {
  return {
    senderEmail: `ticket-list-${suffix}@example.com`,
    senderName: `Ticket List Customer ${suffix}`,
    subject: `Ticket list test ${suffix}`,
    body: `Body for ticket list e2e test ${suffix}.`,
    providerMessageId: `ticket-list-msg-${suffix}`,
  };
}

// Seeds one ticket via the inbound-email webhook (the only way tickets get
// created today — there is no ticket-creation UI yet) and returns the
// payload used, so callers can assert against the exact values they seeded.
async function seedTicket(request: APIRequestContext, suffix: string) {
  const payload = makePayload(suffix);

  const response = await request.post(WEBHOOK_PATH, {
    headers: { [WEBHOOK_SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET },
    data: payload,
  });
  expect(response.status()).toBe(201);

  return payload;
}

test.describe('Tickets list (admin)', () => {
  test.use({ storageState: adminAuthFile });

  test('shows a seeded ticket with the expected columns', async ({ page, request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-admin`;
    const payload = await seedTicket(request, suffix);

    await page.goto('/tickets');
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: payload.subject });
    await expect(row).toBeVisible();
    await expect(row).toContainText(payload.senderName);
    await expect(row).toContainText(payload.senderEmail);
    await expect(row).toContainText('open');
    await expect(row).toContainText('—');
    await expect(row).toContainText('Unassigned');
  });

  test('lists newest tickets first', async ({ page, request }) => {
    const base = `${Date.now()}-${test.info().parallelIndex}-sort`;
    const ticketA = await seedTicket(request, `${base}-a`);
    const ticketB = await seedTicket(request, `${base}-b`);

    await page.goto('/tickets');

    const rowA = page.getByRole('row').filter({ hasText: ticketA.subject });
    const rowB = page.getByRole('row').filter({ hasText: ticketB.subject });
    await expect(rowA).toBeVisible();
    await expect(rowB).toBeVisible();

    const rowTexts = await page.getByRole('row').allTextContents();
    const indexA = rowTexts.findIndex((text) => text.includes(ticketA.subject));
    const indexB = rowTexts.findIndex((text) => text.includes(ticketB.subject));

    expect(indexA).toBeGreaterThan(-1);
    expect(indexB).toBeGreaterThan(-1);
    // Newest-first: ticket B was created after ticket A, so it must render
    // in an earlier row.
    expect(indexB).toBeLessThan(indexA);
  });
});

test.describe('Tickets list (agent)', () => {
  // Uses the e2e-only agent fixture (server/prisma/seed-e2e-agent.ts) and the
  // storageState saved by e2e/agent-auth.setup.ts — proves /tickets is not
  // admin-gated the way /users is.
  test.use({ storageState: agentAuthFile });

  test('agent sees the Tickets nav link and can load a seeded ticket, but not the Users link', async ({
    page,
    request,
  }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-agent`;
    const payload = await seedTicket(request, suffix);

    await page.goto('/tickets');

    await expect(page).toHaveURL('/tickets');
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();

    const row = page.getByRole('row').filter({ hasText: payload.subject });
    await expect(row).toBeVisible();
  });
});

test.describe('Unauthenticated session routing', () => {
  // No storageState override: the 'chromium' project has no default
  // storageState, so this test already starts from a fresh, logged-out
  // browser context — same convention as protected-routes.spec.ts.

  test('direct navigation to /tickets redirects to /login', async ({ page }) => {
    await page.goto('/tickets');
    await expect(page).toHaveURL('/login');
  });
});
