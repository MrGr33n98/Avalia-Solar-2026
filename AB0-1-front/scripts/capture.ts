import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

const TABS = [
  'overview',
  'analytics',
  'ranking-performance',
  'reviews',
  'review-forms',
  'trust-widget',
  'leads',
  'live-inbox',
  'icp-config',
  'product-general',
  'product-categories',
  'product-catalog',
  'product-downloads',
  'media',
  'product-pricing',
  'product-banner',
  'product-sponsored-description',
  'product-features',
  'integrations',
  'sector-questions',
  'avalia-badges',
  'product-support',
];

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

if (!email || !password) {
  throw new Error('Defina E2E_EMAIL e E2E_PASSWORD antes de executar captura autenticada.');
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['iPhone 13 Pro'] });
  const page = await context.newPage();
  const outputDir = path.join(process.cwd(), 'artifacts', 'pwa-mobile-views');

  fs.mkdirSync(outputDir, { recursive: true });
  await page.goto(`${baseUrl}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard**');

  for (const tab of TABS) {
    await page.goto(`${baseUrl}/dashboard?tab=${tab}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(outputDir, `${tab}.png`),
      fullPage: false,
    });
  }

  await browser.close();
})().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
