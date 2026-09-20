import { test, expect, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');

// Same pattern as tickets-list.spec.ts / inbound-email-webhook.spec.ts: read
// the webhook secret and the server's own origin straight from
// server/.env.test rather than hardcoding either value here.
const testEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../server/.env.test')),
);
const API_URL = testEnv.TEST_API_URL;
const WEBHOOK_PATH = `${API_URL}/api/webhooks/inbound-email`;
const WEBHOOK_SECRET_HEADER = testEnv.INBOUND_EMAIL_WEBHOOK_SECRET_HEADER;

// Seeds one ticket via the inbound-email webhook (the only way tickets get
// created today — there is no ticket-creation UI yet) and returns its id so
// the caller can navigate straight to /tickets/:id.
async function seedTicket(request: APIRequestContext, suffix: string) {
  const response = await request.post(WEBHOOK_PATH, {
    headers: { [WEBHOOK_SECRET_HEADER]: testEnv.INBOUND_EMAIL_WEBHOOK_SECRET },
    data: {
      senderEmail: `user-mgmt-${suffix}@example.com`,
      senderName: `User Mgmt Customer ${suffix}`,
      subject: `User mgmt test ${suffix}`,
      body: `Body for user management e2e test ${suffix}.`,
      providerMessageId: `user-mgmt-msg-${suffix}`,
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.ticket.id as number;
}

test.describe('User management CRUD (admin)', () => {
  test.use({ storageState: adminAuthFile });

  test('admin can create, edit, and delete a user', async ({ page }) => {
    // Unique per run so parallel specs never collide in the shared DB.
    const suffix = `${Date.now()}-${test.info().parallelIndex}`;
    const initialName = `E2E Test User ${suffix}`;
    const initialEmail = `e2e-user-${suffix}@example.com`;
    const updatedName = `E2E Updated User ${suffix}`;
    const updatedEmail = `e2e-user-updated-${suffix}@example.com`;
    const password = 'Password123!';

    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

    // --- Create ---
    await page.getByRole('button', { name: 'Create user' }).click();

    const createDialog = page.getByRole('dialog');
    await expect(createDialog.getByRole('heading', { name: 'Create user' })).toBeVisible();

    await createDialog.getByLabel('Name').fill(initialName);
    await createDialog.getByLabel('Email').fill(initialEmail);
    await createDialog.getByLabel('Password').fill(password);
    await createDialog.getByRole('button', { name: 'Create user' }).click();

    await expect(createDialog).not.toBeVisible();

    const createdRow = page.getByRole('row').filter({ hasText: initialEmail });
    await expect(createdRow).toBeVisible();
    await expect(createdRow.getByText(initialName)).toBeVisible();
    await expect(createdRow.getByText('agent')).toBeVisible();

    // --- Update ---
    await createdRow.getByRole('button', { name: `Edit ${initialName}` }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByRole('heading', { name: 'Edit user' })).toBeVisible();
    await expect(editDialog.getByLabel('Name')).toHaveValue(initialName);
    await expect(editDialog.getByLabel('Email')).toHaveValue(initialEmail);
    await expect(editDialog.getByLabel('New password')).toHaveValue('');

    await editDialog.getByLabel('Name').fill(updatedName);
    await editDialog.getByLabel('Email').fill(updatedEmail);
    await editDialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(editDialog).not.toBeVisible();

    const updatedRow = page.getByRole('row').filter({ hasText: updatedEmail });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.getByText(updatedName)).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: initialEmail })).toHaveCount(0);

    // Other rows (e.g. the seeded admin/agent fixtures) should be unaffected.
    await expect(page.getByRole('row').filter({ hasText: 'Admin' })).toBeVisible();

    // --- Delete ---
    await updatedRow.getByRole('button', { name: `Delete ${updatedName}` }).click();

    const deleteDialog = page.getByRole('dialog');
    await expect(deleteDialog.getByRole('heading', { name: 'Delete user' })).toBeVisible();
    await expect(
      deleteDialog.getByText(
        `Are you sure you want to delete ${updatedName}? This action cannot be undone.`,
      ),
    ).toBeVisible();

    await deleteDialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(deleteDialog).not.toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: updatedEmail })).toHaveCount(0);
    await expect(page.getByRole('row').filter({ hasText: updatedName })).toHaveCount(0);
  });

  test('deleting an assigned agent unassigns their tickets', async ({ page, request }) => {
    const suffix = `${Date.now()}-${test.info().parallelIndex}-unassign`;
    const agentName = `E2E Assignee ${suffix}`;
    const agentEmail = `e2e-assignee-${suffix}@example.com`;

    await page.goto('/users');
    await page.getByRole('button', { name: 'Create user' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByLabel('Name').fill(agentName);
    await createDialog.getByLabel('Email').fill(agentEmail);
    await createDialog.getByLabel('Password').fill('Password123!');
    await createDialog.getByRole('button', { name: 'Create user' }).click();
    await expect(createDialog).not.toBeVisible();

    const ticketId = await seedTicket(request, suffix);
    await page.goto(`/tickets/${ticketId}`);

    await page.getByRole('combobox', { name: 'Assigned To' }).click();
    await page.getByRole('option', { name: agentName }).click();
    await expect(page.getByRole('combobox', { name: 'Assigned To' })).toContainText(agentName);

    await page.goto('/users');
    const agentRow = page.getByRole('row').filter({ hasText: agentEmail });
    await agentRow.getByRole('button', { name: `Delete ${agentName}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: agentEmail })).toHaveCount(0);

    await page.goto(`/tickets/${ticketId}`);
    await expect(page.getByRole('combobox', { name: 'Assigned To' })).toContainText('Unassigned');
  });
});
