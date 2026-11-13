import { expect, test } from '@playwright/test';

const widths = [320, 360, 375, 393, 414, 640, 768, 800, 820, 1024, 1280, 1440, 1920];
const screenshotWidths = new Set([393, 800, 1440]);

test('placeholder Free preserva composição completa em larguras mobile, tablet e desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Valida viewport múltiplo uma vez no Chromium.');

  await page.goto('/companies/trends-solar-energy', { waitUntil: 'domcontentloaded' });
  const banner = page.getByRole('img', { name: 'Banner institucional Avalia Solar' });
  await expect(banner).toBeVisible();

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(banner).toBeVisible();
    await expect(banner).toHaveCSS('object-fit', 'contain');

    const imageGeometry = await banner.evaluate((image: HTMLImageElement) => ({
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      currentSrc: image.currentSrc,
    }));
    expect(imageGeometry.complete).toBe(true);
    expect(imageGeometry.naturalWidth).toBeGreaterThan(0);
    const expectedAsset = '/assets/avalia-solar-banner-v3.webp';
    expect(decodeURIComponent(imageGeometry.currentSrc)).toContain(expectedAsset);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(hasHorizontalOverflow).toBe(false);

    if (screenshotWidths.has(width)) {
      await page.screenshot({
        path: testInfo.outputPath(`company-free-placeholder-${width}.png`),
        fullPage: false,
      });
    }
  }
});
