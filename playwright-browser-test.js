const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://www.google.com');
  const title = await page.title();
  console.log('Page title:', title);
  
  await page.screenshot({ path: 'google-screenshot.png' });
  console.log('Screenshot saved: google-screenshot.png');
  
  await browser.close();
  console.log('Browser closed');
})();
