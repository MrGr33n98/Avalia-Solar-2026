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

  test('deve exibir o Tour Interativo com a empresa fictícia SolarMax Integradora e permitir navegação manual', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    const tourSection = page.locator('#tour-interativo');
    await expect(tourSection).toBeVisible();

    // Verifica a empresa fictícia do tour
    await expect(page.locator('text=SolarMax Integradora').first()).toBeVisible();

    // Verifica aviso de dados ilustrativos
    await expect(
      page.locator('text=Dados ilustrativos da empresa fictícia SolarMax Integradora')
    ).toBeVisible();

    // Interação com o botão de avançar
    const nextButton = page.locator('button:has-text("Avançar para Próximo"), button:has-text("Próximo Recurso")').first();
    await nextButton.click();

    // Deve ativar o controle manual e pausar o autoplay
    await expect(page.locator('text=Controle manual ativo').first()).toBeVisible();

    // Deve ter avançado para a etapa 2
    await expect(page.locator('text=Catálogo de Produtos Fotovoltaicos').first()).toBeVisible();
  });

  test('deve exibir os módulos Bento com distinção de pacotes e count-up', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/founder');

    // Verifica presença dos módulos técnicos
    await expect(page.locator('text=Vitrine de Inversores, Baterias e Sistemas Homologados').first()).toBeVisible();
    await expect(page.locator('text=Avaliações com Critérios Técnicos').first()).toBeVisible();
    await expect(page.locator('text=Sem Taxas Ocultas por Lead').first()).toBeVisible();
    await expect(page.locator('text=Painel Analítico de Acessos').first()).toBeVisible();
    await expect(page.locator('text=Bloqueio de Anúncios Competitivos').first()).toBeVisible();
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

