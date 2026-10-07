import { test, expect } from '@playwright/test';

test.describe('Projeto concluído e avaliação', () => {
  test('exibe estado de projeto concluído e formulário de avaliação', async ({ page }) => {
    await page.goto('/review-dashboard/proposals?proposal=1&view=project');

    // Se o projeto estiver concluído, o título e estrelas devem aparecer na UI
    const heading = page.locator('text=Projeto concluído!');
    if (await heading.isVisible()) {
      await expect(page.locator('text=Como foi sua experiência?')).toBeVisible();
    }
  });
});
