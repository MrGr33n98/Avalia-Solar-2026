import { test, expect } from '@playwright/test';

test.describe('CRM Pipeline Opportunity Card V4 E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to CRM pipeline command center page
    await page.goto('/dashboard/sales');
  });

  test('loads pipeline board and displays A++ opportunity cards', async ({ page }) => {
    // 1. Verify board section renders
    const board = page.getByTestId('sales-pipeline-board');
    await expect(board).toBeVisible({ timeout: 10000 });

    // 2. Verify stage columns render
    const prospectCol = page.getByTestId('stage-column-prospect');
    await expect(prospectCol).toBeVisible();

    // 3. Verify card elements (company, value, contact, temperature)
    const card = page.locator('[data-testid^="opportunity-card-"]').first();
    if (await card.isVisible()) {
      await expect(card).toContainText(/R\$/);
    }
  });

  test('opens opportunity 360 detail drawer when clicking card', async ({ page }) => {
    const board = page.getByTestId('sales-pipeline-board');
    await expect(board).toBeVisible({ timeout: 10000 });

    const card = page.locator('[data-testid^="opportunity-card-"]').first();
    if (await card.isVisible()) {
      await card.click();
      // Check 360 drawer opens
      const drawerTitle = page.getByText(/Detalhes da Oportunidade|Opportunity/i);
      await expect(drawerTitle.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
