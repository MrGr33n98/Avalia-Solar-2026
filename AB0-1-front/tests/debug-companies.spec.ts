
import { test, expect } from '@playwright/test';

test('debug companies page', async ({ page }) => {
  // Increase timeout
  test.setTimeout(60000);

  // Listen for console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // Listen for API responses
  page.on('response', async response => {
    if (response.url().includes('/api/v1/companies')) {
      console.log('API RESPONSE URL:', response.url());
      console.log('API RESPONSE STATUS:', response.status());
      try {
        const data = await response.json();
        console.log('API DATA PREVIEW:', JSON.stringify(data).substring(0, 500));
      } catch (e) {
        console.log('Failed to parse JSON');
      }
    }
  });

  console.log('Navigating to companies page...');
  await page.goto('https://www.avaliasolar.com.br/companies', { waitUntil: 'networkidle' });

  // Wait a bit for any post-load JS
  await page.waitForTimeout(3000);

  // Check if count is visible
  const countText = await page.locator('h1 + p').innerText().catch(() => 'NOT FOUND');
  console.log('COUNT TEXT:', countText);

  // Check if grid is visible
  const grid = page.locator('[data-testid="companies-grid"]');
  const gridVisible = await grid.isVisible();
  console.log('GRID VISIBLE:', gridVisible);

  if (gridVisible) {
    const cards = grid.locator('> div');
    console.log('CARDS COUNT:', await cards.count());
  } else {
    console.log('GRID NOT FOUND');
    // Check for empty state
    const emptyState = page.locator('h3:has-text("Nenhuma empresa encontrada")');
    console.log('EMPTY STATE VISIBLE:', await emptyState.isVisible());
    
    // Check for skeletons
    const skeletons = page.locator('.animate-pulse');
    console.log('SKELETONS COUNT:', await skeletons.count());
  }

  // Take a screenshot
  await page.screenshot({ path: 'companies-debug.png' });
});
