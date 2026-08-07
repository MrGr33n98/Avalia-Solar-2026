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
  'product-support'
];

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  
  const context = await browser.newContext({
    ...devices['iPhone 13 Pro']
  });

  const page = await context.newPage();
  
  const outputDir = path.join(process.cwd(), 'artifacts', 'pwa-mobile-views');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Logging in...');
  await page.goto('http://localhost:3000/login');
  
  try {
    // Fill credentials
    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    await page.fill('input[name="email"]', 'felipe@avaliasolar.com.br');
    await page.fill('input[name="password"]', 'Bolota16574014@');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard**');
    console.log('Logged in successfully!');

    for (const tab of TABS) {
      console.log(`Capturing tab: ${tab}...`);
      await page.goto(`http://localhost:3000/dashboard?tab=${tab}`);
      
      // Wait for network idle and animations
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); 
      
      await page.screenshot({ 
        path: path.join(outputDir, `${tab}.png`),
        fullPage: false 
      });
    }

  } catch (error) {
    console.error('Error occurred, taking debug screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'debug-login.png') });
    throw error;
  }

  await browser.close();
  console.log(`Saved ${TABS.length} screenshots to ${outputDir}`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
