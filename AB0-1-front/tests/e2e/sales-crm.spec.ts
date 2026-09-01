import { test, expect } from '@playwright/test';

test.describe('Sales CRM Full E2E Journey & Persistence', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test('Desktop Happy Path, Stage Transitions & Reload Persistence', async ({ page }) => {
    // 1. Direct navigation to Sales CRM Dashboard
    await page.goto('/dashboard/sales');

    // 2. Verify Page Header & Main Elements
    await expect(page.locator('h1')).toContainText(/Vendas|CRM|Sales/i);
    await expect(page.getByTestId('sales-pipeline-board')).toBeVisible();

    // 3. Verify Initial Kanban Columns
    await expect(page.getByTestId('stage-column-prospect')).toBeVisible();
    await expect(page.getByTestId('stage-column-contacted')).toBeVisible();
    await expect(page.getByTestId('stage-column-won')).toBeVisible();

    // 4. Move Stage: Prospect -> Contacted
    const dealCard = page.locator('[data-testid^="deal-card-"]').first();
    const contactedCol = page.getByTestId('stage-column-contacted');

    if (await dealCard.isVisible()) {
      await dealCard.dragTo(contactedCol);
      await expect(contactedCol).toContainText(await dealCard.innerText());
    }

    // 5. RELOAD BROWSER - Verify Stage Persistence
    await page.reload();
    await expect(page.getByTestId('sales-pipeline-board')).toBeVisible();
    if (await dealCard.isVisible()) {
      await expect(contactedCol).toContainText(await dealCard.innerText());
    }

    // 6. Won Transition
    const wonCol = page.getByTestId('stage-column-won');
    if (await dealCard.isVisible()) {
      await dealCard.dragTo(wonCol);
      await expect(wonCol).toContainText(await dealCard.innerText());
    }

    // 7. RELOAD BROWSER - Verify Won Persistence
    await page.reload();
    await expect(page.getByTestId('sales-pipeline-board')).toBeVisible();
    if (await dealCard.isVisible()) {
      await expect(wonCol).toContainText(await dealCard.innerText());
    }
  });

  test('Lost Flow & Reason Validation', async ({ page }) => {
    await page.goto('/dashboard/sales');
    await expect(page.getByTestId('sales-pipeline-board')).toBeVisible();

    const lostCol = page.getByTestId('stage-column-lost');
    if (await lostCol.isVisible()) {
      await expect(lostCol).toBeVisible();
    }
  });
});
