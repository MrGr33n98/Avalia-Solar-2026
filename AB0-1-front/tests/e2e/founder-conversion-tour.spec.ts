import { expect, test } from '@playwright/test';

test.describe('Tour dos pontos de conversão Founder', () => {
  test.setTimeout(90_000);

  test('exibe capturas originais, permite navegar pelas cinco etapas e oferece os CTAs finais', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const tour = page.locator('#founder-conversion-tour');
    await tour.scrollIntoViewIfNeeded();
    await expect(
      tour.getByRole('heading', {
        name: 'Sua empresa pode ser encontrada em diferentes momentos da decisão.',
      })
    ).toBeVisible();
    await expect(tour.getByText('01 / 05')).toBeVisible();

    const image = tour.locator('img[alt*="Captura real da plataforma"]');
    await expect
      .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
      .toBeGreaterThan(0);
    expect(await image.getAttribute('src')).toContain('avalia-solar-btn-01.PNG');

    await tour.getByRole('button', { name: 'Próximo' }).click();
    await expect(tour.getByText('02 / 05')).toBeVisible();
    await expect(
      tour.getByRole('heading', { name: 'O orçamento também está no comparador' })
    ).toBeVisible();

    await tour
      .getByRole('button', { name: 'Ir para etapa 3: Contato no momento da recomendação' })
      .click();
    await expect(tour.locator('img[alt*="Captura real da plataforma"]')).toHaveAttribute(
      'src',
      /avalia-solar-btn-03\.PNG/
    );

    await tour
      .getByRole('button', {
        name: 'Ir para etapa 5: Vários pontos de contato. Uma presença empresarial organizada.',
      })
      .click();
    await expect(
      tour.getByRole('heading', {
        name: 'Vários pontos de contato. Uma presença empresarial organizada.',
      })
    ).toBeVisible();
    await expect(
      tour.getByRole('link', { name: 'Agendar demonstração do Plano Founder' })
    ).toHaveAttribute('href', 'https://zbooking.us/6shCH');
    await expect(tour.getByRole('link', { name: 'Conhecer a Brand Page' })).toHaveAttribute(
      'href',
      '#tour-interativo'
    );
    await page.screenshot({ path: 'test-results/founder-conversion-desktop.png', fullPage: false });
  });

  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    test(`mantém a seção sem overflow em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/founder', { waitUntil: 'domcontentloaded' });
      const tour = page.locator('#founder-conversion-tour');
      await tour.scrollIntoViewIfNeeded();
      await expect(tour.getByRole('button', { name: 'Próximo' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBe(true);
      if (width === 390)
        await page.screenshot({
          path: 'test-results/founder-conversion-mobile.png',
          fullPage: false,
        });
    });
  }

  test('navegação manual pausa a apresentação e os botões da captura não são links interativos', async ({
    page,
  }) => {
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });
    const tour = page.locator('#founder-conversion-tour');
    await tour.scrollIntoViewIfNeeded();
    const play = tour.getByRole('button', { name: 'Reproduzir' });
    if (await play.isVisible()) await play.click();
    await tour
      .getByRole('button', { name: 'Ir para etapa 2: O orçamento também está no comparador' })
      .click();
    await expect(tour.getByRole('button', { name: 'Reproduzir' })).toBeVisible();
    expect(await tour.locator('[data-tour-screen] a, [data-tour-screen] button').count()).toBe(0);
  });

  test('permite navegar por teclado e respeita movimento reduzido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });
    const tour = page.locator('#founder-conversion-tour');
    await tour.scrollIntoViewIfNeeded();
    await tour.getByRole('button', { name: 'Reproduzir' }).click();
    await tour.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      )
    );
    await expect(tour.getByText('02 / 05')).toBeVisible();
    await tour.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
      )
    );
    await expect(tour.getByText('01 / 05')).toBeVisible();
  });
});
