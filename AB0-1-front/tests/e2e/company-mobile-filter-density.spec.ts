import { expect, test } from '@playwright/test';

const viewports = [320, 375, 390, 430];

test.describe('Mobile/PWA quick filters — no clipped labels', () => {
  for (const width of viewports) {
    test(`all four chips are readable on ${width}px without wrapping or clipping`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/companies');

      const bar = page.getByTestId('mobile-company-filter-bar');
      await expect(bar).toBeVisible({ timeout: 20_000 });
      const buttons = bar.locator(':scope > button');
      await expect(buttons).toHaveCount(4);

      // Real geometry checks, not just assertions on class names.
      const rects = await buttons.evaluateAll((nodes) =>
        nodes.map((node) => {
          const el = node as HTMLElement;
          const rect = el.getBoundingClientRect();
          return {
            left: rect.left, right: rect.right, top: rect.top,
            bottom: rect.bottom, height: rect.height,
            scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
          };
        })
      );
      const barRect = await bar.boundingBox();
      expect(barRect).not.toBeNull();
      for (const rect of rects) {
        expect(rect.left).toBeGreaterThanOrEqual(barRect!.x - 1);
        expect(rect.right).toBeLessThanOrEqual(barRect!.x + barRect!.width + 1);
        expect(rect.height).toBeGreaterThanOrEqual(43);
        expect(rect.height).toBeLessThanOrEqual(45);
        expect(rect.scrollWidth).toBeLessThanOrEqual(rect.clientWidth + 1);
        expect(Math.abs(rect.top - rects[0].top)).toBeLessThanOrEqual(1);
      }

      const narrowLocation = bar.getByTestId('location-label-narrow');
      const wideLocation = bar.getByTestId('location-label-wide');
      const narrowCategory = bar.getByTestId('category-label-narrow');
      const wideCategory = bar.getByTestId('category-label-wide');
      const narrowVerified = bar.getByTestId('verified-label-narrow');
      const wideVerified = bar.getByTestId('verified-label-wide');

      if (width < 375) {
        await expect(narrowLocation).toBeVisible();
        await expect(narrowLocation).toHaveText('Local');
        await expect(wideLocation).toBeHidden();
      } else {
        await expect(wideLocation).toBeVisible();
        await expect(wideLocation).toHaveText('Perto');
        await expect(narrowLocation).toBeHidden();
      }

      if (width < 390) {
        await expect(narrowCategory).toBeVisible();
        await expect(narrowCategory).toHaveText('Cat.');
        await expect(narrowVerified).toBeVisible();
        await expect(narrowVerified).toHaveText('Verif.');
        await expect(wideCategory).toBeHidden();
        await expect(wideVerified).toBeHidden();
      } else {
        await expect(wideCategory).toBeVisible();
        await expect(wideCategory).toHaveText('Categoria');
        await expect(wideVerified).toBeVisible();
        await expect(wideVerified).toHaveText('Verificadas');
        await expect(narrowCategory).toBeHidden();
        await expect(narrowVerified).toBeHidden();
      }

      // A source-text based regression would miss actual ellipsis from a CSS overflow rule.
      const allTextFits = await bar.locator('button span').evaluateAll((nodes) =>
        nodes.filter((node) => getComputedStyle(node).display !== 'none')
          .every((node) => node.scrollWidth <= node.clientWidth + 1)
      );
      expect(allTextFits).toBe(true);
    });
  }
});
