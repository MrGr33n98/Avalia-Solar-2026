import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

test.describe('Comparador Visual Free × Brand Page Premium (/founder)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'avaliasolar_consent',
        JSON.stringify({ analytics: false, marketing: false, lastUpdated: Date.now() })
      );
    });
    await page.goto('/founder');
  });

  test('CA01 & CA02: exibe comparador com imagens reais e não cards vazios', async ({ page }) => {
    const section = page.locator('#comparador-visual');
    await expect(section).toBeVisible();

    // H2 e Subheadline oficiais
    await expect(section.locator('h2')).toContainText(
      'Veja a diferença entre um perfil básico e uma Brand Page completa.'
    );

    // Ambas imagens reais devem estar presentes no DOM
    const freeImage = section.locator('img[src*="founder-free"]:visible');
    const premiumImage = section.locator('img[src*="founder-premium"]:visible');
    const mobileFreeTab = section.getByRole('tab', { name: 'Antes · Perfil Básico' });

    if (await mobileFreeTab.isVisible()) {
      await expect(premiumImage).toBeVisible();
      await mobileFreeTab.click();
      await expect(freeImage).toBeVisible();
    } else {
      await expect(freeImage).toBeVisible();
      await expect(premiumImage.last()).toBeVisible();
    }
  });

  test('CA03: presets 0%, 50% e 100% atualizam o slider acessível', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const slider = page.locator('#comparador-visual [role="slider"]').first();
    await expect(slider).toBeVisible();

    // Preset 0%: Ver perfil básico
    await page.click('button:has-text("Ver perfil básico (0%)")');
    await expect(slider).toHaveAttribute('aria-valuenow', '0');

    // Preset 100%: Ver Brand Page
    await page.click('button:has-text("Ver Brand Page (100%)")');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');

    // Preset 50%: Meio a meio
    await page.click('button:has-text("Meio a meio (50%)")');
    await expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  test('CA05: alternância para modo Lado a Lado no desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Clicar em "Ver lado a lado"
    await page.click('button:has-text("Ver lado a lado")');

    // Duas colunas completas visíveis
    const sideBySide = page.getByTestId('comparison-side-by-side');
    await expect(sideBySide).toBeVisible();
    await expect(sideBySide.locator('img')).toHaveCount(2);

    // Voltar para "Arraste para comparar"
    await page.click('button:has-text("Arraste para comparar")');
    const slider = page.locator('#comparador-visual [role="slider"]').first();
    await expect(slider).toBeVisible();
  });

  test('CA06: visualização mobile em tabs e modal de ampliação', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const section = page.locator('#comparador-visual');
    await expect(section).toBeVisible();

    // Tabs mobile
    const tabFree = section.locator('button:has-text("Antes · Perfil Básico")').first();
    const tabPremium = section.locator('button:has-text("Depois · Brand Page")').first();

    await expect(tabFree).toBeVisible();
    await expect(tabPremium).toBeVisible();

    // Alternar para Free
    await tabFree.click();
    await expect(section.locator('text=Estrutura padrão gratuita').first()).toBeVisible();

    // Botão icon-only: acessível por nome, sem rótulo visível.
    const expandButton = section.getByRole('button', { name: 'Ampliar para leitura' });
    await expect(expandButton).toBeVisible();
    await expect(expandButton.locator('svg')).toHaveCount(1);
    await expect(expandButton).toHaveText('');
    await expandButton.click();

    // Modal aberto
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('img').first()).toBeVisible();

    // Fechar modal via botão
    await modal.locator('button[aria-label="Fechar visualizador"]').click();
    await expect(modal).not.toBeVisible();
  });

  test('CA06c: tabs compactas, separadas e sem ícones em PWA 320–430px', async ({ page }) => {
    const section = page.locator('#comparador-visual');
    const before = section.getByRole('tab', { name: 'Antes · Perfil Básico' });
    const after = section.getByRole('tab', { name: 'Depois · Brand Page' });

    for (const width of [320, 360, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(before).toBeVisible();
      await expect(after).toBeVisible();
      await expect(before.locator('svg')).toHaveCount(0);
      await expect(after.locator('svg')).toHaveCount(0);

      const left = await before.boundingBox();
      const right = await after.boundingBox();
      expect(left).not.toBeNull();
      expect(right).not.toBeNull();
      expect(left!.height).toBe(40);
      expect(right!.height).toBe(40);
      expect(right!.x - (left!.x + left!.width)).toBeGreaterThanOrEqual(8);
      expect(right!.x + right!.width).toBeLessThanOrEqual(width - 12);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

      await before.click();
      await expect(before).toHaveAttribute('aria-selected', 'true');
      await expect(before).toHaveCSS('background-color', 'rgb(255, 240, 205)');
      await after.click();
      await expect(after).toHaveAttribute('aria-selected', 'true');
      await expect(after).toHaveCSS('background-color', 'rgb(15, 98, 254)');
    }
  });

  test('CA06d: ampliar segue icon-only em visualização com divisor', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const section = page.locator('#comparador-visual');
    await section.getByRole('button', { name: 'Comparar com divisor' }).click();

    const expandButton = section.getByRole('button', { name: 'Ampliar captura em tela cheia' });
    await expect(expandButton).toBeVisible();
    await expect(expandButton).toHaveText('');
    await expect(expandButton.locator('svg')).toHaveCount(1);
    await expandButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('CA06b: mobile permite comparar sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const section = page.locator('#comparador-visual');
    await expect(section).toBeAttached();
    await section.scrollIntoViewIfNeeded();
    await section.getByRole('button', { name: 'Comparar com divisor' }).click();
    await expect(section.getByRole('slider')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test('QA visual: salva estados do comparador e larguras solicitadas', async ({ page }) => {
    const outputDir = join(process.cwd(), 'test-results', 'founder-comparison');
    mkdirSync(outputDir, { recursive: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/founder');
    const section = page.locator('#comparador-visual');
    await page.evaluate(() =>
      document.getElementById('comparador-visual')?.scrollIntoView({ block: 'start' })
    );
    for (const preset of [
      { label: 'Ver perfil básico (0%)', file: 'reveal-0.png' },
      { label: 'Meio a meio (50%)', file: 'reveal-50.png' },
      { label: 'Ver Brand Page (100%)', file: 'reveal-100.png' },
    ]) {
      await section.getByRole('button', { name: preset.label }).click();
      await section.screenshot({ path: join(outputDir, preset.file) });
    }

    await section.getByRole('button', { name: 'Ver lado a lado' }).click();
    await section.screenshot({ path: join(outputDir, 'lado-a-lado.png') });

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/founder');
      await page.evaluate(() =>
        document.getElementById('comparador-visual')?.scrollIntoView({ block: 'start' })
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await page.locator('#comparador-visual').screenshot({
        path: join(outputDir, `viewport-${width}.png`),
      });
    }
  });

  test('CA07: controle acessível via teclado (Setas, Home e End)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const slider = page.locator('#comparador-visual [role="slider"]').first();
    await slider.focus();

    // Pressionar End (100% Brand Page)
    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');

    // Pressionar Home (0% Brand Page)
    await page.keyboard.press('Home');
    await expect(slider).toHaveAttribute('aria-valuenow', '0');

    // Pressionar Seta Direita (+5%)
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '5');
  });

  test('CA10: CTAs de conversão com URLs e destinos corretos', async ({ page }) => {
    const section = page.locator('#comparador-visual');

    // CTA de Agendamento
    const bookingLink = section.locator('a[href="https://zbooking.us/6shCH"]');
    await expect(bookingLink).toBeVisible();
    await expect(bookingLink).toHaveAttribute('target', '_blank');

    // CTA do Blog Founder
    const blogLink = section.locator('a[href="/blog/plano-founder-avalia-solar"]');
    await expect(blogLink).toBeVisible();
  });
});
