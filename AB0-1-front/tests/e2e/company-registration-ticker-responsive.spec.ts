import { expect, test } from '@playwright/test';

const viewportWidths = [320, 390, 768, 1440, 2560] as const;

test.describe.skip('Faixa de cadastro — mobile, PWA e web desktop (desabilitada temporariamente para AS Watch)', () => {
  for (const width of viewportWidths) {
    test(`marquee cobre toda a área e CTA permanece compacto em ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 820 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const ticker = page.getByTestId('company-registration-ticker');
      const viewport = page.getByTestId('company-registration-viewport');
      const groups = page.getByTestId('company-registration-group');
      const cta = page.getByTestId('company-registration-cta');
      const pill = page.getByTestId('company-registration-cta-pill');

      await expect(ticker).toBeVisible();
      await expect(cta).toBeVisible();
      await expect(groups).toHaveCount(2);
      await expect
        .poll(async () => {
          const viewportBox = await viewport.boundingBox();
          const groupBox = await groups.first().boundingBox();
          return !!viewportBox && !!groupBox && groupBox.width > viewportBox.width;
        })
        .toBe(true);

      const [tickerBox, viewportBox, firstBox, secondBox, ctaBox, pillBox] =
        await Promise.all([
          ticker.boundingBox(),
          viewport.boundingBox(),
          groups.nth(0).boundingBox(),
          groups.nth(1).boundingBox(),
          cta.boundingBox(),
          pill.boundingBox(),
        ]);

      expect(tickerBox).not.toBeNull();
      expect(viewportBox).not.toBeNull();
      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      expect(ctaBox).not.toBeNull();
      expect(pillBox).not.toBeNull();

      if (!tickerBox || !viewportBox || !firstBox || !secondBox || !ctaBox || !pillBox)
        return;

      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(tickerBox.x).toBeGreaterThanOrEqual(-1);
      expect(tickerBox.width).toBeGreaterThanOrEqual(clientWidth - 1);
      expect(tickerBox.x + tickerBox.width).toBeLessThanOrEqual(clientWidth + 1);
      expect(firstBox.width).toBeGreaterThan(viewportBox.width);
      expect(Math.abs(firstBox.width - secondBox.width)).toBeLessThan(1);
      expect(ctaBox.x).toBeGreaterThanOrEqual(viewportBox.x + viewportBox.width - 1);
      expect(ctaBox.x + ctaBox.width).toBeLessThanOrEqual(clientWidth + 1);
      expect(pillBox.height).toBeGreaterThanOrEqual(29);
      expect(pillBox.height).toBeLessThanOrEqual(33);
      expect(ctaBox.height).toBeGreaterThanOrEqual(width < 768 ? 44 : 40);
      expect(tickerBox.height).toBe(width < 768 ? 48 : 40);
    });
  }

  test('marquee se desloca continuamente, sem mover o botão', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.mouse.move(0, 400);

    const track = page.getByTestId('company-registration-track');
    const cta = page.getByTestId('company-registration-cta');
    await expect(track).toBeVisible();

    const before = await track.evaluate((el) => getComputedStyle(el).transform);
    const ctaBefore = await cta.boundingBox();
    await page.waitForTimeout(450);
    const after = await track.evaluate((el) => getComputedStyle(el).transform);
    const ctaAfter = await cta.boundingBox();

    expect(after).not.toEqual(before);
    expect(ctaAfter?.x).toBeCloseTo(ctaBefore?.x ?? 0, 0);
  });

  test('redução de movimento deixa a mensagem estática e o CTA visível', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const track = page.getByTestId('company-registration-track');
    await expect(track).toBeVisible();
    expect(await track.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await expect(page.getByTestId('company-registration-cta')).toBeVisible();
  });
});
