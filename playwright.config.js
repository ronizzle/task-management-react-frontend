import { defineConfig, devices } from '@playwright/test';

// Assumes the Laravel API (VITE_LARAVEL_API_URL, see .env) and Node
// service (VITE_NODE_API_URL) are already running locally — Playwright
// only manages the React dev server itself. Serial/single-worker on
// purpose: specs share seeded backend state (same login rate limiter,
// same Engineering team) and login is throttled to 5/min on Laravel.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    // Logs in as each seeded role once via the real UI and saves the
    // resulting session (localStorage token + user) to e2e/.auth/*.json.
    // Every other spec reuses that storage state instead of logging in
    // again — Laravel's /login route is throttled to 5 requests/min, and a
    // suite that logs in per-test would blow through that immediately.
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
