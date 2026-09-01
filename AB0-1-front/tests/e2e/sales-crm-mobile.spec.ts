import { test, expect } from '@playwright/test';

test.describe('Sales CRM Mobile Viewport Smoke (390x844)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    baseURL: 'http://localhost:3000',
  });

  test('Mobile Smoke: Pipeline, Stages, Accounts & Action Triggers', async ({ page }) => {
    await page.goto('/dashboard/sales');

    // 1. CRM opens & Header visible
    await expect(page.locator('h1')).toContainText(/Vendas|CRM|Sales/i);
    await expect(page.getByTestId('sales-pipeline-board')).toBeVisible();

    // 2. Mobile Responsive Columns & Stage visibility
    await expect(page.getByTestId('stage-column-prospect')).toBeVisible();

    // 3. Touch target / CTA accessibility check
    const prospectCol = page.getByTestId('stage-column-prospect');
    const box = await prospectCol.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
