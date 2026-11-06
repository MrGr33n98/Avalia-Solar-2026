import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { name: 'Small Mobile 320px', width: 320, height: 640 },
  { name: 'Standard Mobile 375px', width: 375, height: 812 },
  { name: 'Large Mobile 414px', width: 414, height: 896 },
];

const CATEGORY_SLUG = process.env.E2E_CATEGORY_SLUG || 'energia-solar';

test.describe('Category Mobile Responsiveness & Structural SEO (CDSI-120)', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`[${viewport.name}] renders single H1, no horizontal overflow, and no dead subroute links`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(`/categories/${CATEGORY_SLUG}`, {
        waitUntil: 'domcontentloaded',
      });

      expect(response?.status()).toBe(200);

      await expect(page.locator('h1')).toHaveCount(1);

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(hasHorizontalOverflow).toBe(false);

      await expect(page.locator(`a[href="/categories/${CATEGORY_SLUG}/about"]`)).toHaveCount(0);
      await expect(page.locator(`a[href="/categories/${CATEGORY_SLUG}/guides"]`)).toHaveCount(0);
      await expect(page.locator(`a[href="/categories/${CATEGORY_SLUG}/reviews"]`)).toHaveCount(0);
    });
  }
});

