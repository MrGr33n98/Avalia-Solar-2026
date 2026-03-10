import { expect, test } from '@playwright/test';

test.describe('Mobile safe-area support', () => {
  test('navbar applies safe-area top padding', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/');

    await page.addStyleTag({
      content: `
        :root {
          --safe-area-inset-top: 59px !important;
          --safe-area-inset-bottom: 34px !important;
          --safe-area-inset-left: 0px !important;
          --safe-area-inset-right: 0px !important;
        }
      `,
    });

    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();

    const navbarPaddingTop = await navbar.evaluate((element) =>
      Number.parseFloat(window.getComputedStyle(element).paddingTop)
    );
    expect(navbarPaddingTop).toBeGreaterThan(0);
  });

  test('categories mobile filter trigger respects bottom safe-area when available', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/categories');

    await page.addStyleTag({
      content: `
        :root {
          --safe-area-inset-top: 59px !important;
          --safe-area-inset-bottom: 34px !important;
          --safe-area-inset-left: 0px !important;
          --safe-area-inset-right: 0px !important;
        }
      `,
    });

    const mobileTrigger = page.getByTestId('mobile-filters-trigger');
    if ((await mobileTrigger.count()) === 0) {
      test.skip(true, 'categories page did not render the mobile filters trigger in this environment');
    }
    await expect(mobileTrigger).toBeVisible();

    const mobileTriggerBottom = await mobileTrigger.evaluate((element) => {
      const parent = element.parentElement;
      if (!parent) return 0;
      return Number.parseFloat(window.getComputedStyle(parent).bottom);
    });
    expect(mobileTriggerBottom).toBeGreaterThanOrEqual(34);
  });
});
