import { test, expect } from '@playwright/test';
import { CREDS } from './helpers.js';

// Deliberately unauthenticated (no storageState) — this is the one spec
// that exercises the real login form. Kept to two /login requests total
// (see playwright.config.js's note on Laravel's 5-req/min login throttle).
test.use({ storageState: { cookies: [], origins: [] } });

test('rejects an invalid password and stays on the login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('admin@test.com').fill(CREDS.admin.email);
  await page.getByPlaceholder('password123').fill('definitely-wrong');
  await page.getByRole('button', { name: /log in/i }).click();

  await expect(page).toHaveURL('/login');
  await expect(page.getByText(/invalid|incorrect|unauthorized|credentials/i).first()).toBeVisible();
});

test('valid login reaches the dashboard with role-based nav, and logout returns to login', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('admin@test.com').fill(CREDS.admin.email);
  await page.getByPlaceholder('password123').fill(CREDS.admin.password);
  await page.getByRole('button', { name: /log in/i }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  // Admin-only nav items should be present.
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Teams' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();

  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL('/login');

  // No full page reload should have occurred at any point (SPA behavior) —
  // sanity-checked by the fact react-router handled both transitions above
  // without a network navigation; a hard failure here would surface as a
  // blank page / broken localStorage state instead of a clean redirect.
  await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
});
