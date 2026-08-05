import { test as setup, expect } from '@playwright/test';
import { CREDS } from './helpers.js';

for (const role of Object.keys(CREDS)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const { email, password } = CREDS[role];
    await page.goto('/login');
    await page.getByPlaceholder('admin@test.com').fill(email);
    await page.getByPlaceholder('password123').fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL('/');
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
