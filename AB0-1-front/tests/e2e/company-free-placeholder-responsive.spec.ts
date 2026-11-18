import { expect, test } from '@playwright/test';

const widths = [320, 360, 375, 393, 414, 640, 768, 800, 820, 1024, 1280, 1440, 1920, 2560];
const screenshotWidths = new Set([393, 800, 1440, 1920]);

test('banner institucional não gera barras, recortes nem sombras em mobile/PWA e web', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Verificação multiviewport no Chromium.');

  // O Compose de CI provisiona esta empresa Free: o teste não pode depender
  // de um perfil existente apenas no banco persistente de produção.
  const slug = 'e2e-banner-free';
  const companyResponse = await page.request.get(`/api/v1/companies/by_slug/${slug}`);
  expect(
    companyResponse.ok(),
    `Fixture E2E ausente: GET /api/v1/companies/by_slug/${slug} retornou ${companyResponse.status()} — ${await companyResponse.text()}`
  ).toBe(true);
  const { company } = await companyResponse.json();
  expect(company?.slug, 'O backend deve retornar a empresa Free correta').toBe(slug);
  expect(company?.has_paid_plan, 'O perfil E2E não deve possuir plano pago').toBe(false);
  expect(company?.feature_access?.promo_banner?.value, 'Banner promocional deve estar desabilitado').toBe(false);
  expect(company?.banner_url, 'A empresa Free não deve expor um banner personalizado').toBeFalsy();

  const pageResponse = await page.goto(`/companies/${company.slug}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(pageResponse, 'A Brand Page precisa responder à navegação').not.toBeNull();
  expect(pageResponse?.status(), 'A Brand Page não pode retornar HTTP 4xx/5xx').toBeLessThan(400);

  const image = page.getByRole('img', { name: 'Banner institucional Avalia Solar' });
  // O caminho público ativo usa CompanyProfileShell -> CompanyPremiumHero;
  // CompanyHero é um fallback legado e não participa desta navegação.
  await expect(page.locator('#company-profile-shell')).toBeVisible({ timeout: 15000 });
  const frame = page.getByTestId('company-premium-banner-frame');
  await expect(frame).toBeVisible({ timeout: 15000 });
  await expect(image).toBeVisible({ timeout: 15000 });
  await expect.poll(
    () => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    { message: 'O WebP institucional precisa terminar de carregar antes da análise geométrica' }
  ).toBe(true);

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(image).toBeVisible();

    const geometry = await image.evaluate((img: HTMLImageElement) => {
      const imageRect = img.getBoundingClientRect();
      const frameRect = img.closest('[data-testid="company-premium-banner-frame"]')?.getBoundingClientRect();
      const computed = getComputedStyle(img);
      return {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        declaredWidth: img.getAttribute('width'),
        declaredHeight: img.getAttribute('height'),
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

    // A arte VP8 original tem 1024×191 pixels, lidos diretamente do arquivo.
    // Comparar ALTURA em pixels evita falsos negativos do Next/Image: ao reduzir
    // um banner muito largo, o otimizador arredonda a altura para pixel inteiro.
    // Nunca aumentar artificialmente a tolerância de proporção em valores absolutos.
    expect(geometry.declaredWidth, 'width HTML precisa coincidir com o WebP real').toBe('1024');
    expect(geometry.declaredHeight, 'height HTML precisa coincidir com o WebP real').toBe('191');
    const targetRatio = 1024 / 191;
    const expectedHeight = geometry.imageWidth / targetRatio;
    expect(
      Math.abs(geometry.imageHeight - expectedHeight),
      `Viewport ${width}px: imagem ${geometry.imageWidth}×${geometry.imageHeight}px, esperada altura ${expectedHeight.toFixed(2)}px; arquivo original 1024×191; source ${geometry.currentSrc}`
    ).toBeLessThanOrEqual(1.25);
    // Arquivo otimizado também deve preservar proporção, com no máximo
    // 1 pixel de arredondamento vertical na miniatura WebP gerada.
    expect(
      Math.abs(geometry.naturalHeight - geometry.naturalWidth / targetRatio),
      `Next/Image alterou a geometria além de 1px: ${geometry.naturalWidth}×${geometry.naturalHeight}`
    ).toBeLessThanOrEqual(1.25);
    expect(Math.abs(geometry.frameWidth - geometry.imageWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.frameHeight - geometry.imageHeight)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.frameTop - geometry.imageTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.frameLeft - geometry.imageLeft)).toBeLessThanOrEqual(1);
    expect(geometry.fit).not.toBe('cover');

    // Contrato único para PWA/mobile/tablet/desktop: topo em 90°,
    // mantendo o arredondamento apenas na base do card da Brand Page.
    const corners = await page.locator('#company-profile-compound-hero').evaluate((card) => {
      const cardStyle = getComputedStyle(card);
      const hero = card.querySelector('#company-premium-hero');
      if (!hero) throw new Error('CompanyPremiumHero não encontrado');
      const heroStyle = getComputedStyle(hero);
      return {
        cardTopLeft: cardStyle.borderTopLeftRadius,
        cardTopRight: cardStyle.borderTopRightRadius,
        heroTopLeft: heroStyle.borderTopLeftRadius,
        heroTopRight: heroStyle.borderTopRightRadius,
        cardBottomLeft: cardStyle.borderBottomLeftRadius,
        cardBottomRight: cardStyle.borderBottomRightRadius,
      };
    });
    expect(corners.cardTopLeft, `Viewport ${width}px: topo esquerdo do card`).toBe('0px');
    expect(corners.cardTopRight, `Viewport ${width}px: topo direito do card`).toBe('0px');
    expect(corners.heroTopLeft, `Viewport ${width}px: topo esquerdo do banner`).toBe('0px');
    expect(corners.heroTopRight, `Viewport ${width}px: topo direito do banner`).toBe('0px');
    expect(parseFloat(corners.cardBottomLeft)).toBeGreaterThan(0);
    expect(parseFloat(corners.cardBottomRight)).toBeGreaterThan(0);

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
