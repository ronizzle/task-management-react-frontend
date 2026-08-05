import { test, expect } from '@playwright/test';
import { unique } from './helpers.js';

test.describe('Admin: Teams + Users pages', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('creates a team and expands it to view members', async ({ page }) => {
    const teamName = unique('Playwright Team');

    await page.goto('/teams');
    await page.getByPlaceholder('New team name').fill(teamName);
    await page.getByRole('button', { name: 'Create team' }).click();
    await expect(page.getByText('Team created.')).toBeVisible();

    const teamRow = page.getByRole('button', { name: new RegExp(teamName) });
    await expect(teamRow).toBeVisible();
    await teamRow.click();
    await expect(page.getByText('Hide')).toBeVisible();
  });

  test('creates a user and toggles their active status', async ({ page }) => {
    const email = `pw.user.${Date.now()}@test.com`;

    await page.goto('/users');
    await page.getByRole('button', { name: 'New User' }).click();
    await page.getByPlaceholder('Name').fill('Playwright User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('User created.')).toBeVisible();

    const row = page.locator('tr', { hasText: email });
    await expect(row).toBeVisible();
    await expect(row.getByText('Active')).toBeVisible();

    await row.getByRole('button', { name: 'Deactivate' }).click();
    await expect(page.getByText('User deactivated.')).toBeVisible();
    await expect(row.getByText('Inactive')).toBeVisible();
  });
});

test.describe('Role-based nav visibility: manager', () => {
  test.use({ storageState: 'e2e/.auth/manager.json' });

  test('sees Teams/Analytics but not Users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Teams' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  });
});

test.describe('Role-based nav visibility: team member', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('sees none of Teams/Users/Analytics, and a direct /users nav bounces home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Teams' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Analytics' })).toHaveCount(0);

    await page.goto('/users');
    await expect(page).toHaveURL('/');
  });
});
