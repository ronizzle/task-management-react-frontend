import { expect } from '@playwright/test';

export const CREDS = {
  admin: { email: process.env.ADMIN_EMAIL || 'admin@test.com', password: process.env.ADMIN_PASSWORD || 'password123' },
  manager: { email: process.env.MANAGER_EMAIL || 'manager@test.com', password: process.env.MANAGER_PASSWORD || 'password123' },
  member: { email: process.env.MEMBER_EMAIL || 'member@test.com', password: process.env.MEMBER_PASSWORD || 'password123' },
};

export async function login(page, role) {
  const { email, password } = CREDS[role];
  await page.goto('/login');
  await page.getByPlaceholder('admin@test.com').fill(email);
  await page.getByPlaceholder('password123').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL('/');
}

export async function logout(page) {
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL('/login');
}

export function unique(label) {
  return `${label} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
