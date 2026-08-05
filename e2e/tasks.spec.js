import { test, expect } from '@playwright/test';
import { unique } from './helpers.js';

test.use({ storageState: 'e2e/.auth/admin.json' });

test.describe('Tasks List + Task Detail', () => {
  test('creates a task, filters the list, transitions its status, comments, and deletes it', async ({ page }) => {
    const title = unique('Playwright task');

    await page.goto('/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByPlaceholder('Title').fill(title);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('Task created.')).toBeVisible();

    const taskLink = page.getByRole('link', { name: title });
    await expect(taskLink).toBeVisible();

    // Filter by status=pending should still show the freshly created task.
    // Select order in the toolbar: team, status, priority, saved-presets.
    const statusFilter = page.locator('select').nth(1);
    await statusFilter.selectOption('pending');
    await expect(page.getByRole('link', { name: title })).toBeVisible();
    await statusFilter.selectOption('');

    await taskLink.click();
    await expect(page).toHaveURL(/\/tasks\/\d+/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // pending -> in_progress via the UI transition button.
    await page.getByRole('button', { name: /mark as in progress/i }).click();
    await expect(page.getByText('Status updated to in progress.')).toBeVisible();
    await expect(page.getByText('in progress', { exact: true })).toBeVisible();

    // Comment thread: post then delete.
    const commentBody = unique('Playwright comment');
    await page.getByPlaceholder('Add a comment…').fill(commentBody);
    await page.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByText(commentBody)).toBeVisible();

    // Scope to the comment's own list item — the task card above it also
    // has a "Delete" button (for the task itself).
    const commentItem = page.locator('li', { hasText: commentBody });
    page.once('dialog', (dialog) => dialog.accept());
    await commentItem.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(commentBody)).not.toBeVisible();

    // Clean up the task itself (creator + admin, so delete is allowed).
    // Only the task's own Delete button remains now.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Task deleted.')).toBeVisible();
    await expect(page).toHaveURL('/tasks');
  });

  test('edits a task\'s fields', async ({ page }) => {
    const title = unique('Editable task');
    const newTitle = unique('Edited task');

    await page.goto('/tasks');
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByPlaceholder('Title').fill(title);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('link', { name: title }).click();

    await page.getByRole('button', { name: 'Edit' }).click();
    const titleInput = page.locator('form input[required]').first();
    await titleInput.fill(newTitle);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Task updated.')).toBeVisible();
    await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();
  });
});
