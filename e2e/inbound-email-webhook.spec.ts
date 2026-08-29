import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);

// These tests hit the server directly rather than through the client, so
// they need the server's own origin, not the client baseURL configured in
// playwright.config.ts (`use.baseURL`, which points at the client on 4173).
// 4001 is the dedicated e2e server port hardcoded in playwright.config.ts's
// TEST_SERVER_PORT.
const API_URL = 'http://localhost:4001';
const WEBHOOK_PATH = `${API_URL}/api/webhooks/inbound-email`;
const SECRET_HEADER = 'x-webhook-secret';

function makePayload(suffix: string, overrides: Partial<Record<string, string>> = {}) {
  return {
    senderEmail: `customer-${suffix}@example.com`,
    senderName: 'Test Customer',
    subject: `Help needed ${suffix}`,
    body: `This is the body of test email ${suffix}.`,
    providerMessageId: `msg-${suffix}`,
    ...overrides,
  };
}

// This endpoint is unauthenticated-by-session on purpose (external email
// providers can't send our app's session cookies) — no test.use({
// storageState }) here, unlike every other e2e spec that talks to the API.

test.describe('POST /api/webhooks/inbound-email', () => {
  test('valid token + valid payload creates a new ticket', async ({ request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-a`;
    const payload = makePayload(suffix);

    const response = await request.post(WEBHOOK_PATH, {
      headers: { [SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET },
      data: payload,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.ticket.subject).toBe(payload.subject);
    expect(body.ticket.status).toBe('open');
    expect(body.ticket.category).toBeNull();
    expect(body.ticket.requesterEmail).toBe(payload.senderEmail);
    expect(typeof body.ticket.id).toBe('number');
    expect(body.message.body).toBe(payload.body);
  });

  test('a reply from the same sender threads into the existing ticket', async ({ request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-b`;
    const headers = { [SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET };
    const original = makePayload(suffix);

    const first = await request.post(WEBHOOK_PATH, { headers, data: original });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();

    const reply = makePayload(`${suffix}-reply`, {
      senderEmail: original.senderEmail,
      subject: `Re: ${original.subject}`,
    });
    const second = await request.post(WEBHOOK_PATH, { headers, data: reply });

    expect(second.status()).toBe(201);
    const secondBody = await second.json();
    expect(secondBody.ticket.id).toBe(firstBody.ticket.id);
    expect(secondBody.message.id).not.toBe(firstBody.message.id);
  });

  test('the same subject from a different sender creates a separate ticket', async ({
    request,
  }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-c`;
    const headers = { [SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET };
    const original = makePayload(suffix);

    const first = await request.post(WEBHOOK_PATH, { headers, data: original });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();

    const fromSomeoneElse = makePayload(`${suffix}-other`, {
      subject: original.subject,
    });
    const second = await request.post(WEBHOOK_PATH, { headers, data: fromSomeoneElse });

    expect(second.status()).toBe(201);
    const secondBody = await second.json();
    expect(secondBody.ticket.id).not.toBe(firstBody.ticket.id);
  });

  test('missing shared-secret header returns 401 and creates nothing', async ({ request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-d`;
    const payload = makePayload(suffix);

    const unauthedResponse = await request.post(WEBHOOK_PATH, { data: payload });
    expect(unauthedResponse.status()).toBe(401);
    expect(await unauthedResponse.json()).toEqual({ error: 'Unauthorized' });

    // Prove nothing was created for this providerMessageId: a subsequent,
    // properly authenticated request with the same id must create a *new*
    // ticket (201), not be treated as a pre-existing duplicate (200).
    const authedResponse = await request.post(WEBHOOK_PATH, {
      headers: { [SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET },
      data: payload,
    });
    expect(authedResponse.status()).toBe(201);
  });

  test('wrong shared-secret header returns 401', async ({ request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-e`;
    const response = await request.post(WEBHOOK_PATH, {
      headers: { [SECRET_HEADER]: 'not-the-real-secret' },
      data: makePayload(suffix),
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  test('duplicate providerMessageId is idempotent', async ({ request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-f`;
    const payload = makePayload(suffix);
    const headers = { [SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET };

    const first = await request.post(WEBHOOK_PATH, { headers, data: payload });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();

    const second = await request.post(WEBHOOK_PATH, { headers, data: payload });
    expect(second.status()).toBe(200);
    const secondBody = await second.json();

    expect(secondBody.ticket.id).toBe(firstBody.ticket.id);
    expect(secondBody.message.id).toBe(firstBody.message.id);
  });

  test('invalid payload returns 400 with a validation message', async ({ request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-g`;
    const response = await request.post(WEBHOOK_PATH, {
      headers: { [SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET },
      data: makePayload(suffix, { senderEmail: 'not-an-email' }),
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Enter a valid sender email address' });
  });
});
