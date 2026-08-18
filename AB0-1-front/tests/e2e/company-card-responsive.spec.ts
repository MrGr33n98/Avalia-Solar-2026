import { test, expect } from '@playwright/test';

const viewports = [320, 360, 375, 390, 393, 412, 430];

test.describe('CompanyCard standard responsivo', () => {
  for (const width of viewports) {
    test(`não ultrapassa limites em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/companies');

      const cards = page.locator('[data-testid="company-card"]');
      const count = await cards.count();
      test.skip(count === 0, 'Nenhum CompanyCard renderizado no ambiente de teste');

      for (let index = 0; index < count; index += 1) {
        const card = cards.nth(index);
        const cardBox = await card.boundingBox();
        expect(cardBox).not.toBeNull();

        const buttons = card.locator('button, a');
        for (let childIndex = 0; childIndex < (await buttons.count()); childIndex += 1) {
          const childBox = await buttons.nth(childIndex).boundingBox();
          expect(childBox).not.toBeNull();
          expect(childBox!.left).toBeGreaterThanOrEqual(cardBox!.left - 1);
          expect(childBox!.right).toBeLessThanOrEqual(cardBox!.right + 1);
        }

        expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      }
    });
  }

  test('não quebra na troca de label em 379, 380 e 381px', async ({ page }) => {
    for (const width of [379, 380, 381]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/companies');

      const cards = page.locator('[data-testid="company-card"]');
      if ((await cards.count()) === 0) continue;

      expect(await cards.first().evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
  });

  test('mantém integridade após orientação portrait-landscape-portrait', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/companies');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.setViewportSize({ width: 390, height: 844 });

    const card = page.locator('[data-testid="company-card"]').first();
    if ((await card.count()) === 0) test.skip(true, 'Nenhum CompanyCard renderizado no ambiente de teste');
    expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  });
});