
import { test, expect } from '@playwright/test';

test('debug companies page', async ({ page }) => {
  // Listen for console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // Listen for API responses
  page.on('response', response => {
    if (response.url().includes('/api/v1/companies')) {
      console.log('API RESPONSE URL:', response.url());
      console.log('API RESPONSE STATUS:', response.status());
      response.json().then(data => {
        console.log('API DATA PREVIEW:', JSON.stringify(data).substring(0, 500));
      }).catch(e => console.log('Failed to parse JSON', e));
    }
  });

  await page.goto('https://www.avaliasolar.com.br/companies', { waitUntil: 'networkidle' });

  // Check if count is visible
  const countText = await page.textContent('h1 + p');
  console.log('COUNT TEXT:', countText);

  // Check if grid is visible
  const grid = await page.locator('[data-testid="companies-grid"]');
  const gridCount = await grid.count();
  console.log('GRID COUNT:', gridCount);

  if (gridCount > 0) {
    const cards = await grid.locator('> div');
    console.log('CARDS COUNT:', await cards.count());
  } else {
    console.log('GRID NOT FOUND');
    // Check for empty state
    const emptyState = await page.locator('h3:has-text("Nenhuma empresa encontrada")');
    console.log('EMPTY STATE VISIBLE:', await emptyState.isVisible());
    
    // Check for skeletons
    const skeletons = await page.locator('.animate-pulse');
    console.log('SKELETONS COUNT:', await skeletons.count());
  }

  // Take a screenshot for visual debugging
  await page.screenshot({ path: 'companies-debug.png' });
});
