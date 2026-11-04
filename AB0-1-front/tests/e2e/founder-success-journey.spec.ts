import { expect, test } from '@playwright/test';

const expectedTitles = [
  'Estratégia de Categoria',
  'Estratégia de SEO / Conteúdo',
  'Estratégia de Reviews',
  'Oportunidades',
  'Apoio em Performance',
  'Prova Social',
  'Sales Enablement',
];

test.describe('Explorador da Jornada Founder', () => {
  test('preserva as sete etapas e sincroniza seleção, painel e prévia', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const section = page.getByRole('region', { name: 'Seu crescimento, passo a passo.' });
    await expect(section.getByRole('heading', { name: 'Seu crescimento, passo a passo.' })).toBeVisible();
    const tabs = section.getByRole('tab');
    await expect(tabs).toHaveCount(7);
    for (let index = 0; index < expectedTitles.length; index += 1) {
      await expect(tabs.nth(index)).toHaveAccessibleName(`Etapa ${String(index + 1).padStart(2, '0')}: ${expectedTitles[index]}`);
    }

    const panel = section.getByRole('tabpanel');
    await expect(panel.getByRole('heading', { name: 'Estratégia de Categoria' })).toBeVisible();
    await expect(panel.locator('img')).toHaveAttribute('src', /brand-page-premium/);
    await section.scrollIntoViewIfNeeded();
    await expect.poll(() => panel.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await tabs.nth(2).click();
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('heading', { name: 'Estratégia de Reviews' })).toBeVisible();
    await expect(panel).toContainText('uma nova review a cada três meses');

    await section.getByRole('button', { name: 'Próximo passo' }).click();
    await expect(panel.getByRole('heading', { name: 'Oportunidades' })).toBeVisible();
    await expect(panel).toContainText('Não há venda de leads ou garantia de contatos.');
    await tabs.nth(6).click();
    await expect(panel.getByRole('heading', { name: 'Sales Enablement' })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Conhecer o Plano Founder' })).toHaveAttribute('href', 'https://zbooking.us/6shCH');
    await tabs.nth(3).click();

    await section.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/founder-journey-explorer-desktop.png', fullPage: false });
    await expect(page.getByRole('heading', { name: 'Veja como a Brand Page opera na tela do computador' })).toBeAttached();
  });

  test('suporta teclado e swipe horizontal no painel sem interceptar rolagem vertical', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const section = page.getByRole('region', { name: 'Seu crescimento, passo a passo.' });
    const tabs = section.getByRole('tab');
    await tabs.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

    const panel = section.getByRole('tabpanel');
    await panel.evaluate((element) => {
      const start = new Touch({ identifier: 1, target: element, clientX: 300, clientY: 200 });
      const end = new Touch({ identifier: 1, target: element, clientX: 220, clientY: 204 });
      element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [start], changedTouches: [start] }));
      element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [end] }));
    });
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('heading', { name: 'Estratégia de Reviews' })).toBeVisible();
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: 'test-results/founder-journey-explorer-mobile.png' });
  });

  test('mantém a seção sem overflow nas larguras mobile, tablet e desktop', async ({ page }) => {
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });
    for (const width of [360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `overflow horizontal em ${width}px`).toBe(false);
    }
  });

  test('remove transições para preferência por movimento reduzido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });
    const section = page.getByRole('region', { name: 'Seu crescimento, passo a passo.' });
    const tab = section.getByRole('tab').nth(0);
    await expect.poll(() => tab.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('none');
  });
});
