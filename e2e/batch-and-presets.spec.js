import { test, expect } from '@playwright/test';
import { unique } from './helpers.js';

test.use({ storageState: 'e2e/.auth/admin.json' });

async function createTask(page, title) {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByPlaceholder('Title').fill(title);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText('Task created.')).toBeVisible();
}

test('batch status-change and delete across multiple selected tasks', async ({ page }) => {
  const titleA = unique('Batch A');
  const titleB = unique('Batch B');

  await page.goto('/tasks');
  await createTask(page, titleA);
  await createTask(page, titleB);

  await page.getByRole('checkbox', { name: `Select ${titleA}` }).check();
  await page.getByRole('checkbox', { name: `Select ${titleB}` }).check();
  await expect(page.getByText('2 selected')).toBeVisible();

  await page.getByRole('button', { name: 'Set status' }).click();
  await expect(page.getByText(/task\(s\) updated\.|succeeded/)).toBeVisible();

  // Re-select the same two tasks for cleanup via batch delete.
  await page.getByRole('checkbox', { name: `Select ${titleA}` }).check();
  await page.getByRole('checkbox', { name: `Select ${titleB}` }).check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete selected' }).click();
  await expect(page.getByRole('link', { name: titleA })).toHaveCount(0);
  await expect(page.getByRole('link', { name: titleB })).toHaveCount(0);
});

test('saves, applies, and deletes a filter preset', async ({ page }) => {
  const presetName = unique('Playwright preset');

  await page.goto('/tasks');
  const statusFilter = page.locator('select').nth(1);
  await statusFilter.selectOption('pending');

  await page.getByRole('button', { name: 'Save current filters' }).click();
  await page.getByPlaceholder(/preset name/i).fill(presetName);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Filter preset saved.')).toBeVisible();

  // Reset filters, then re-apply via the saved preset dropdown.
  await statusFilter.selectOption('');
  // team, status, priority, assignee (admin-only), saved filters
  const presetSelect = page.locator('select').nth(4);
  await presetSelect.selectOption({ label: presetName });
  await expect(statusFilter).toHaveValue('pending');

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Filter preset deleted.')).toBeVisible();
});
