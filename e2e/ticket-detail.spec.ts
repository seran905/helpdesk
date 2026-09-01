import { test, expect, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Same pattern as tickets-list.spec.ts / inbound-email-webhook.spec.ts: read
// the webhook secret and the server's own origin straight from
// server/.env.test rather than hardcoding either value here.
const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

const API_URL = testEnv.TEST_API_URL;
const WEBHOOK_PATH = `${API_URL}/api/webhooks/inbound-email`;
const WEBHOOK_SECRET_HEADER = testEnv.INBOUND_EMAIL_WEBHOOK_SECRET_HEADER;

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');

function makePayload(suffix: string) {
  return {
    senderEmail: `ticket-detail-${suffix}@example.com`,
    senderName: `Ticket Detail Customer ${suffix}`,
    subject: `Ticket detail test ${suffix}`,
    body: `Body for ticket detail e2e test ${suffix}.`,
    providerMessageId: `ticket-detail-msg-${suffix}`,
  };
}

// Seeds one ticket via the inbound-email webhook (the only way tickets get
// created today — there is no ticket-creation UI yet), same pattern as
// tickets-list.spec.ts, but also returns the created ticket's id from the
// response body so callers can navigate straight to /tickets/:id.
async function seedTicket(request: APIRequestContext, suffix: string) {
  const payload = makePayload(suffix);

  const response = await request.post(WEBHOOK_PATH, {
    headers: { [WEBHOOK_SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET },
    data: payload,
  });
  expect(response.status()).toBe(201);
  const body = await response.json();

  return { payload, ticketId: body.ticket.id as number };
}

// Fetches the ticket straight from the server (bypassing the UI's
// second-precision `toLocaleString()` formatting) so timestamp-change
// assertions aren't at the mercy of two events landing in the same second.
async function getTicket(request: APIRequestContext, ticketId: number) {
  const response = await request.get(`${API_URL}/api/tickets/${ticketId}`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.ticket as { updatedAt: string };
}

async function selectOption(
  page: import('@playwright/test').Page,
  comboboxName: string,
  optionName: string,
) {
  await page.getByRole('combobox', { name: comboboxName }).click();
  await page.getByRole('option', { name: optionName }).click();
}

test.describe('Ticket detail page (admin)', () => {
  test.use({ storageState: adminAuthFile });

  test('shows the seeded ticket subject, requester, and original message with no Agent badge', async ({
    page,
    request,
  }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-view`;
    const { payload, ticketId } = await seedTicket(request, suffix);

    await page.goto(`/tickets/${ticketId}`);

    await expect(page.getByRole('heading', { name: payload.subject })).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Requester:.*${payload.senderEmail}`)),
    ).toBeVisible();

    const messageCard = page.getByText(payload.body).locator('..');
    await expect(messageCard).toBeVisible();
    await expect(messageCard).toContainText(payload.senderName);
    await expect(messageCard).not.toContainText('Agent');

    await expect(page.getByText('No replies yet.')).toBeVisible();
  });

  test('submitting a reply persists it, shows the Agent badge, and bumps Updated', async ({
    page,
    request,
  }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-reply`;
    const { ticketId } = await seedTicket(request, suffix);

    const before = await getTicket(request, ticketId);

    await page.goto(`/tickets/${ticketId}`);
    await expect(page.getByText('No replies yet.')).toBeVisible();

    const replyBody = `Reply body ${suffix}`;
    await page.getByLabel('Reply').fill(replyBody);
    await page.getByRole('button', { name: 'Send reply' }).click();

    // ReplyForm's onSuccess invalidates the ['ticket', id] query, so the new
    // reply and the bumped Updated timestamp should appear without a manual
    // reload — but reload afterwards too, proving it was actually persisted
    // server-side rather than only patched into client cache.
    const replyCard = page.getByText(replyBody).locator('..');
    await expect(replyCard).toBeVisible();
    await expect(replyCard).toContainText('Agent');
    await expect(page.getByText('No replies yet.')).not.toBeVisible();

    await page.reload();
    await expect(page.getByText(replyBody).locator('..')).toContainText('Agent');

    const after = await getTicket(request, ticketId);
    expect(after.updatedAt).not.toBe(before.updatedAt);
  });

  test('changing status, category, and assignee persists across reload', async ({
    page,
    request,
  }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-update`;
    const { ticketId } = await seedTicket(request, suffix);

    await page.goto(`/tickets/${ticketId}`);
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();

    // Starting values from the webhook-created ticket. Triggers also render
    // a chevron icon alongside the label, so match with a substring rather
    // than an exact string.
    await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('open');
    await expect(page.getByRole('combobox', { name: 'Category' })).toContainText('uncategorized');
    await expect(page.getByRole('combobox', { name: 'Assigned To' })).toContainText('Unassigned');

    await selectOption(page, 'Status', 'resolved');
    await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('resolved');

    await selectOption(page, 'Category', 'refund request');
    await expect(page.getByRole('combobox', { name: 'Category' })).toContainText(
      'refund request',
    );

    await selectOption(page, 'Assigned To', 'Test Agent');
    await expect(page.getByRole('combobox', { name: 'Assigned To' })).toContainText('Test Agent');

    // Reload to prove these round-tripped through the server rather than
    // just updating client state / the TanStack Query cache.
    await page.reload();

    await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('resolved');
    await expect(page.getByRole('combobox', { name: 'Category' })).toContainText(
      'refund request',
    );
    await expect(page.getByRole('combobox', { name: 'Assigned To' })).toContainText('Test Agent');
  });
});

test.describe('Unauthenticated session routing', () => {
  // No storageState override: the 'chromium' project has no default
  // storageState, so this test already starts from a fresh, logged-out
  // browser context — same convention as tickets-list.spec.ts /
  // protected-routes.spec.ts.

  test('direct navigation to /tickets/:id redirects to /login', async ({ page, request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-unauth`;
    const { ticketId } = await seedTicket(request, suffix);

    await page.goto(`/tickets/${ticketId}`);
    await expect(page).toHaveURL('/login');
  });
});
