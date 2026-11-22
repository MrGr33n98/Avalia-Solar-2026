import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Mobile Pequeno (320px)', width: 320, height: 600 },
  { name: 'iPhone SE (375px)', width: 375, height: 667 },
  { name: 'iPhone 14 / Modern Mobile (390px)', width: 390, height: 844 },
  { name: 'Tablet / iPad (768px)', width: 768, height: 1024 },
  { name: 'Desktop Médio (1024px)', width: 1024, height: 768 },
  { name: 'Desktop Widescreen (1440px)', width: 1440, height: 900 },
];

test.describe('Avalia Solar Founder Motion System E2E', () => {
  test('deve renderizar a landing /founder com Hero Reveal, selo oficial e CTAs', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    // Verifica Hero e Headline
    const heading = page.locator('h1');
    await expect(heading).toContainText('Plano Founder Avalia Solar');
    await expect(heading).toContainText('construa sua presença');

    // Verifica CTAs de agendamento e blog
    const bookingCta = page.locator('a[href="https://zbooking.us/6shCH"]').first();
    await expect(bookingCta).toBeVisible();

    const blogLink = page.locator('a[href="/blog/plano-founder-avalia-solar"]').first();
    await expect(blogLink).toBeVisible();
  });

  test('deve exibir o Tour Interativo cinematográfico e permitir navegar pelas dez etapas', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    const tourSection = page.locator('#tour-interativo');
    await expect(tourSection).toBeVisible();

    await expect(tourSection.getByText('01 / 10')).toBeVisible();
    await expect(tourSection.getByText('Hero Banner Customizável')).toBeVisible();
    await expect(tourSection.locator('img[alt*="Captura original da Brand Page"]')).toHaveAttribute(
      'src',
      /brand-page-premium/
    );

    // Interação com o botão de avançar
    const nextButton = tourSection.getByRole('button', { name: 'Próximo recurso' });
    await nextButton.click();

    // Deve ativar o controle manual e pausar o autoplay
    await expect(tourSection.getByText('02 / 10')).toBeVisible();
    await expect(tourSection.getByText('Selo de Verificação')).toBeVisible();

    const titles = [
      'Hero Banner Customizável',
      'Selo de Verificação',
      'Solicitar Orçamento',
      'Sobre a Empresa',
      'Produtos em Destaque',
      'Botão WhatsApp',
      'Materiais Baixáveis',
      'Avaliações em Destaque',
      'Portfólio e Projetos',
      'Perfil Protegido Exclusivo',
    ];
    for (const [index, title] of titles.entries()) {
      await tourSection
        .getByRole('button', { name: `Ir para etapa ${index + 1}: ${title}` })
        .click();
      await expect(tourSection.getByRole('heading', { name: title })).toBeVisible();
      const cursor = await tourSection.getByTestId('founder-cinematic-cursor').boundingBox();
      const frame = await tourSection.locator('[aria-label^="Imagem real da Brand Page"]').boundingBox();
      expect(cursor).not.toBeNull();
      expect(frame).not.toBeNull();
      expect(cursor!.x).toBeGreaterThanOrEqual(frame!.x - 1);
      expect(cursor!.y).toBeGreaterThanOrEqual(frame!.y - 1);
      expect(cursor!.x + cursor!.width).toBeLessThanOrEqual(frame!.x + frame!.width + 1);
      expect(cursor!.y + cursor!.height).toBeLessThanOrEqual(frame!.y + frame!.height + 1);
    }
    await expect(tourSection.getByRole('link', { name: 'Agendar apresentação do Plano Founder' })).toHaveAttribute(
      'href',
      'https://zbooking.us/6shCH'
    );
  });

  test('PWA aproxima controles da imagem e evita sobreposição entre as dez etapas', async ({ page }) => {
    for (const width of [320, 360, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/founder');

      const tour = page.locator('#tour-interativo');
      const imageFrame = tour.locator('[aria-label^="Imagem real da Brand Page"]');
      const controls = tour.getByTestId('founder-tour-controls');
      const details = tour.getByTestId('founder-tour-details');
      const navigation = tour.getByRole('group', { name: 'Escolher etapa do tour' });
      const steps = navigation.getByRole('button');
      await expect(steps).toHaveCount(10);

      const frameBox = await imageFrame.boundingBox();
      const controlsBox = await controls.boundingBox();
      const detailsBox = await details.boundingBox();
      const navBox = await navigation.boundingBox();
      expect(frameBox).not.toBeNull();
      expect(controlsBox).not.toBeNull();
      expect(detailsBox).not.toBeNull();
      expect(navBox).not.toBeNull();

      // A reprodução acompanha a imagem, sem descrição ou aviso entre os dois.
      expect(controlsBox!.y - (frameBox!.y + frameBox!.height)).toBeGreaterThanOrEqual(-1);
      expect(controlsBox!.y - (frameBox!.y + frameBox!.height)).toBeLessThanOrEqual(20);
      expect(detailsBox!.y).toBeGreaterThanOrEqual(controlsBox!.y + controlsBox!.height - 1);

      const boxes = [];
      for (let index = 0; index < 10; index++) {
        const indicator = steps.nth(index);
        const box = await indicator.boundingBox();
        expect(box).not.toBeNull();
        boxes.push(box!);
        const minWidth = await indicator.evaluate((button) => getComputedStyle(button).minWidth);
        expect(minWidth).toBe('0px');
        expect(box!.width).toBeGreaterThanOrEqual(24);
        expect(box!.width).toBeLessThanOrEqual(31);
        expect(box!.x).toBeGreaterThanOrEqual(navBox!.x - 1);
        expect(box!.x + box!.width).toBeLessThanOrEqual(navBox!.x + navBox!.width + 1);
      }

      for (let index = 1; index < boxes.length; index++) {
        expect(Math.abs(boxes[index].y - boxes[0].y)).toBeLessThanOrEqual(2);
        expect(boxes[index - 1].x + boxes[index - 1].width).toBeLessThanOrEqual(boxes[index].x + 0.5);
      }

      await tour.getByRole('button', { name: 'Ir para etapa 7: Materiais Baixáveis' }).click();
      await expect(tour.getByRole('heading', { name: 'Materiais Baixáveis' })).toBeVisible();
      await expect(tour.getByRole('button', { name: 'Ir para etapa 7: Materiais Baixáveis' }))
        .toHaveAttribute('aria-current', 'step');

      // O botão de conversão da última etapa não pode produzir overflow horizontal.
      await tour.getByRole('button', { name: /Ir para etapa 10:/ }).click();
      await expect(tour.getByRole('link', { name: 'Agendar apresentação do Plano Founder' })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    }
  });

  test('no desktop preserva layout de imagem à esquerda e descrição acima dos controles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/founder');

    const tour = page.locator('#tour-interativo');
    await expect(tour).toBeVisible();
    const frameLocator = tour.locator('[aria-label^="Imagem real da Brand Page"]');
    await expect(frameLocator).toBeVisible();
    const frame = await frameLocator.boundingBox();
    const controls = await tour.getByTestId('founder-tour-controls').boundingBox();
    const details = await tour.getByTestId('founder-tour-details').boundingBox();
    expect(frame).not.toBeNull();
    expect(controls).not.toBeNull();
    expect(details).not.toBeNull();
    expect(controls!.x).toBeGreaterThan(frame!.x);
    expect(details!.x).toBeGreaterThan(frame!.x);
    expect(details!.y).toBeLessThan(controls!.y);
  });

  test('tour mantém viewport e controles usáveis em mobile e tablet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/founder');
    const tour = page.locator('#tour-interativo');
    const image = tour.locator('img[alt*="Captura original da Brand Page"]');
    await expect(image).toBeAttached();
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth), { timeout: 15000 })
      .toBeGreaterThan(0);

    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(tour.getByRole('button', { name: 'Recurso anterior' })).toBeVisible();
      await expect(tour.getByRole('button', { name: 'Próximo recurso' })).toBeVisible();
      await expect(image).toBeVisible();
      const bounds = await image.boundingBox();
      expect(bounds?.width).toBeGreaterThan(0);
      expect(bounds?.height).toBeGreaterThan(0);
      await expect(tour).toHaveJSProperty('scrollWidth', await tour.evaluate((node) => node.clientWidth));
    }
  });

  test('não deve renderizar a seção de módulos técnicos removida', async ({ page }) => {
    await page.goto('/founder');

    const viewports = [360, 390, 768, 1280, 1440];
    const removedContent = [
      'Estrutura técnica desenhada para conversão e autoridade',
      'Vitrine de Inversores, Baterias e Sistemas Homologados',
      'Avaliações com Critérios Técnicos',
      'Sem Taxas Ocultas por Lead',
      'Painel Analítico de Acessos',
      'Bloqueio de Anúncios Competitivos',
    ];

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 900 });

      for (const content of removedContent) {
        await expect(page.getByText(content, { exact: true })).toHaveCount(0);
      }

      await expect(
        page.getByRole('heading', { name: 'Veja como a Brand Page opera na tela do computador' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', {
          name: 'Veja a diferença entre um perfil básico e uma Brand Page completa.',
        })
      ).toBeVisible();
    }
  });

  test('deve renderizar o comparador Before / After arrastável e acessível', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    const slider = page.locator('[role="slider"]').first();
    await expect(slider).toBeVisible();

    // Verifica labels de Antes e Depois
    await expect(page.locator('text=Antes · Perfil Básico').first()).toBeVisible();
    await expect(page.locator('text=Depois · Brand Page').first()).toBeVisible();

    // Testa os botões de alternância rápida
    const buttonAfter = page.locator('button:has-text("Ver Brand Page (100%)")');
    await buttonAfter.click();
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
  });

  test('deve exibir as 3 etapas reais da jornada Process Draw', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    await expect(page.locator('text=Localizar ou Cadastrar Empresa').first()).toBeVisible();
    await expect(page.locator('text=Solicitar Administração & Homologação').first()).toBeVisible();
    await expect(page.locator('text=Configurar Brand Page & Catálogo').first()).toBeVisible();
  });

  test('deve exibir a seção de liderança com Felipe Henrique Morais como Fundador', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    // Verifica nome e cargo rigorosamente (sem CEO, apenas Fundador)
    await expect(page.locator('h3:has-text("Felipe Henrique Morais")')).toBeVisible();
    await expect(page.locator('p:has-text("Fundador")').first()).toBeVisible();

    // Verifica link de LinkedIn
    const linkedinLink = page.locator('a[href="https://www.linkedin.com/in/felipe-morais-8bb61a7b/"]').first();
    await expect(linkedinLink).toBeVisible();

    // Verifica link de agendamento na seção do fundador
    const bookingLink = page.locator('a:has-text("Agendar Conversa com o Fundador")').first();
    await expect(bookingLink).toBeVisible();
  });

  // Validação Responsiva em todos os Viewports sem overflow horizontal
  for (const vp of VIEWPORTS) {
    test(`deve renderizar responsivamente sem overflow horizontal em ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/founder');

      // Verifica se a largura do scroll horizontal não excede a largura da janela
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test('deve navegar de /founder para o blog e garantir link bidirecional', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    const blogLink = page.locator('a[href="/blog/plano-founder-avalia-solar"]').first();
    await blogLink.click();

    await page.waitForURL(/\/blog\/plano-founder-avalia-solar/);
    expect(page.url()).toContain('/blog/plano-founder-avalia-solar');

    // Verifica se a página do blog contém o link de volta para /founder
    const backToFounderLink = page.locator('a[href="/founder"]').first();
    await expect(backToFounderLink).toBeVisible();
  });
});

