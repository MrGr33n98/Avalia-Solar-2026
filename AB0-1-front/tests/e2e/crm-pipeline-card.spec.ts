import { test, expect } from '@playwright/test';

test.describe('CRM Pipeline Opportunity Card Dual-Density E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to CRM pipeline command center page
    await page.goto('/dashboard/sales');
  });

  test('loads pipeline board and displays compact opportunity cards by default', async ({ page }) => {
    // 1. Verify board section renders
    const board = page.getByTestId('sales-pipeline-board');
    await expect(board).toBeVisible({ timeout: 10000 });

    // 2. Verify stage columns render
    const prospectCol = page.getByTestId('stage-column-prospect');
    await expect(prospectCol).toBeVisible();

    // 3. Verify card renders compact by default
    const card = page.locator('[data-testid^="opportunity-card-"]').first();
    if (await card.isVisible()) {
      await expect(card).toContainText(/R\$/);
      await expect(card).toContainText(/COLD|WARM|HOT/);

      // Verify compact data-testid is present
      const compactContainer = card.locator('[data-testid^="opportunity-card-compact-"]');
      await expect(compactContainer).toBeVisible();

      // Verify expand button is present with aria-expanded="false"
      const expandBtn = card.locator('[data-testid^="opportunity-card-expand-"]');
      await expect(expandBtn).toBeVisible();
      await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('toggles between compact and expanded density without opening details drawer', async ({ page }) => {
    const board = page.getByTestId('sales-pipeline-board');
    await expect(board).toBeVisible({ timeout: 10000 });

    const card = page.locator('[data-testid^="opportunity-card-"]').first();
    if (await card.isVisible()) {
      const expandBtn = card.locator('[data-testid^="opportunity-card-expand-"]');
      await expect(expandBtn).toBeVisible();

      // Click expand button
      await expandBtn.click();

      // Card should now be expanded
      await expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
      const expandedContainer = card.locator('[data-testid^="opportunity-card-expanded-"]');
      await expect(expandedContainer).toBeVisible();

      // Ensure 360 detail drawer did NOT open
      const drawerTitle = page.getByText(/Detalhes da Oportunidade|Opportunity Details/i);
      await expect(drawerTitle).not.toBeVisible();

      // Click collapse button
      await expandBtn.click();

      // Card should be compact again
      await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
      const compactContainer = card.locator('[data-testid^="opportunity-card-compact-"]');
      await expect(compactContainer).toBeVisible();
    }
  });

  test('expands cards individually without affecting other cards', async ({ page }) => {
    const board = page.getByTestId('sales-pipeline-board');
    await expect(board).toBeVisible({ timeout: 10000 });

    const cards = page.locator('[data-testid^="opportunity-card-"]');
    const count = await cards.count();

    if (count >= 2) {
      const cardA = cards.nth(0);
      const cardB = cards.nth(1);

      const expandBtnA = cardA.locator('[data-testid^="opportunity-card-expand-"]');
      const expandBtnB = cardB.locator('[data-testid^="opportunity-card-expand-"]');

      // Expand card A
      await expandBtnA.click();
      await expect(expandBtnA).toHaveAttribute('aria-expanded', 'true');

      // Card B must remain compact
      await expect(expandBtnB).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('opens opportunity 360 detail drawer when clicking card body', async ({ page }) => {
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

  test('preserves checkbox stopPropagation without opening details drawer', async ({ page }) => {
    const board = page.getByTestId('sales-pipeline-board');
    await expect(board).toBeVisible({ timeout: 10000 });

    const card = page.locator('[data-testid^="opportunity-card-"]').first();
    if (await card.isVisible()) {
      const checkbox = card.locator('[data-testid^="opportunity-card-checkbox-"]');
      if (await checkbox.isVisible()) {
        await checkbox.click();
        // Check drawer did not open
        const drawerTitle = page.getByText(/Detalhes da Oportunidade|Opportunity Details/i);
        await expect(drawerTitle).not.toBeVisible();
      }
    }
  });
});
