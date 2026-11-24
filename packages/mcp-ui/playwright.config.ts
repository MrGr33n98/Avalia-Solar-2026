import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const cachedHeadlessShell = path.join(
  os.homedir(),
  '.cache',
  'ms-playwright',
  'chromium_headless_shell-1200',
  'chrome-headless-shell-linux64',
  'chrome-headless-shell'
);

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (!process.env.CI && fs.existsSync(cachedHeadlessShell) ? cachedHeadlessShell : undefined);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4177',
    screenshot: 'only-on-failure',
    launchOptions: executablePath
      ? { executablePath, args: ['--disable-gpu', '--no-sandbox'] }
      : undefined,
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    port: 4177,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
