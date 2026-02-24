const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('https://www.google.com');
    const title = await page.title();
    console.log('Page Title:', title);
    
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot saved as screenshot.png');
    
    await browser.close();
    console.log('Browser closed successfully');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
