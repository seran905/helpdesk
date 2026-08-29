import { test, expect } from '@playwright/test';
import path from 'node:path';

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json');

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
    const rowCountBeforeDelete = await page.getByRole('row').count();

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
    await expect(page.getByRole('row')).toHaveCount(rowCountBeforeDelete - 1);
  });
});
