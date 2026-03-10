import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT || '3010';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PLAYWRIGHT_PORT}`,
    trace: 'on-first-retry',
    serviceWorkers: 'allow',
  },

  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: `cross-env PORT=${PLAYWRIGHT_PORT} NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE=true npm run dev`,
    url: `http://localhost:${PLAYWRIGHT_PORT}`,
    reuseExistingServer: false,
  },
});
