import { expect, test } from '@playwright/test';

const widths = [320, 360, 375, 393, 414, 640, 768, 800, 820, 1024, 1280, 1440, 1920, 2560];
const screenshotWidths = new Set([393, 800, 1440, 1920]);

test('banner institucional não gera barras, recortes nem sombras em mobile/PWA e web', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Verificação multiviewport no Chromium.');

  await page.goto('/companies/trends-solar-energy', { waitUntil: 'domcontentloaded' });
  const image = page.getByRole('img', { name: 'Banner institucional Avalia Solar' });
  const frame = page.getByTestId('company-hero-banner-frame');
  await expect(image).toBeVisible();

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(image).toBeVisible();

    const geometry = await image.evaluate((img: HTMLImageElement) => {
      const imageRect = img.getBoundingClientRect();
      const frameRect = img.closest('[data-testid="company-hero-banner-frame"]')?.getBoundingClientRect();
      const computed = getComputedStyle(img);
      return {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        currentSrc: img.currentSrc,
        imageWidth: imageRect.width,
        imageHeight: imageRect.height,
        imageTop: imageRect.top,
        imageLeft: imageRect.left,
        frameWidth: frameRect?.width ?? 0,
        frameHeight: frameRect?.height ?? 0,
        frameTop: frameRect?.top ?? 0,
        frameLeft: frameRect?.left ?? 0,
        fit: computed.objectFit,
        computedHeight: computed.height,
      };
    });

    expect(geometry.complete).toBe(true);
    expect(geometry.naturalWidth).toBeGreaterThan(0);
    expect(geometry.naturalHeight).toBeGreaterThan(0);
    expect(decodeURIComponent(geometry.currentSrc)).toContain('/assets/avalia-solar-banner-v3.webp');

    // Relação geométrica é calculada pela IMAGEM real, sem depender de altura CSS fixa.
    const expectedRatio = geometry.naturalWidth / geometry.naturalHeight;
    expect(Math.abs(geometry.imageWidth / geometry.imageHeight - expectedRatio)).toBeLessThan(0.015);
    expect(Math.abs(geometry.frameWidth - geometry.imageWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.frameHeight - geometry.imageHeight)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.frameTop - geometry.imageTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.frameLeft - geometry.imageLeft)).toBeLessThanOrEqual(1);
    expect(geometry.fit).not.toBe('cover');

    // O frame institucional não pode receber camadas artificiais de sombra/gradiente.
    await expect(frame.locator('[class*="bg-gradient"], [class*="blur-xl"]')).toHaveCount(0);

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
