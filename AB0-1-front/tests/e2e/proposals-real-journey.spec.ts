import { test, expect } from '@playwright/test';

test.describe('Jornada E2E real de propostas (API real sem Mocks)', () => {
  test('PWA e Web - navegabilidade e resiliência', async ({ page }) => {
    await page.goto('/review-dashboard/proposals');

    // Garantir que o container principal da jornada renderizou
    await expect(page.locator('section[aria-label="Jornada de propostas"]')).toBeVisible();
  });
});
