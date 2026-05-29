import { test, expect } from '@playwright/test';

test.describe('Pricing Page E2E Tests', () => {
  // Teste 1: Exibição da Página e Grade de 4 Planos com as Badges corretas (Desktop)
  test('deve exibir os 4 planos com suas respectivas badges comerciais em desktop', async ({ page }) => {
    // Configura viewport de Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navega para a página de precificação
    await page.goto('/pricing');
    
    // Verifica título principal da página
    await expect(page.locator('h1')).toContainText('Escolha como sua empresa quer aparecer no');
    
    // Verifica se os 4 planos estão listados na grade
    const planFree = page.locator('text="Gratuito"').first();
    const planEssential = page.locator('text="Essencial"').first();
    const planPro = page.locator('text="Pro"').first();
    const planEnterprise = page.locator('text="Enterprise"').first();
    
    await expect(planFree).toBeVisible();
    await expect(planEssential).toBeVisible();
    await expect(planPro).toBeVisible();
    await expect(planEnterprise).toBeVisible();
    
    // Verifica as badges específicas dos planos
    const badgeEssential = page.locator('text="Ótimo custo-benefício"').first();
    const badgePro = page.locator('text="Mais vendido"').first();
    const badgeEnterprise = page.locator('text="Sob consulta"').first();
    
    await expect(badgeEssential).toBeVisible();
    await expect(badgePro).toBeVisible();
    await expect(badgeEnterprise).toBeVisible();
  });

  // Teste 2: Validação de CTAs quando deslogado (Redirecionamento correto)
  test('deve redirecionar para a página de registro com o query param do plano se o usuário estiver deslogado', async ({ page }) => {
    await page.goto('/pricing');
    
    // Clica no CTA do plano Essencial
    const essentialCta = page.locator('button:has-text("Começar no Essencial"), button:has-text("Ir para o painel"), button:has-text("Quero o Pro"), button:has-text("Solicitar Enterprise")').nth(1);
    await essentialCta.click();
    
    // Deve ser redirecionado para a página de registro com ?plan=essential
    await page.waitForURL(/\/register\?plan=essential/);
    expect(page.url()).toContain('/register?plan=essential');
  });

  // Teste 3: Resiliência do BannerSlot (Fallback estático Premium)
  test('deve renderizar o banner de fallback estático se a API de banners falhar ou retornar vazia', async ({ page }) => {
    // Intercepta a rota de banners e simula erro de rede
    await page.route('**/banners**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/pricing');

    // O BannerSlot deve falhar silenciosamente e carregar o DefaultPricingAdBanner
    // O DefaultPricingAdBanner contém a seção "Anuncie na Avalia Solar" ou similar
    const adSectionTitle = page.locator('text="Anuncie na Avalia Solar"').first();
    await expect(adSectionTitle).toBeVisible();
    
    const adSubtitle = page.locator('text="Coloque sua marca diante de centenas de decisores"').first();
    await expect(adSubtitle).toBeVisible();
  });

  // Teste 4: Responsividade Cross-Device e viewports
  test.describe('Validação Responsiva Cross-Device', () => {
    const viewports = [
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      test(`deve renderizar a página corretamente no viewport ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/pricing');
        
        // Verifica que o Hero e os cards principais de planos continuam visíveis
        const header = page.locator('h1').first();
        await expect(header).toBeVisible();
        
        const cardsGrid = page.locator('text="Pro"').first();
        await expect(cardsGrid).toBeVisible();
        
        // A tabela comparativa deve estar renderizada
        const comparisonTitle = page.locator('text="Comparativo de recursos"').first();
        await expect(comparisonTitle).toBeVisible();
      });
    }
  });
});
