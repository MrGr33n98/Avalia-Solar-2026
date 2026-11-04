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

test.describe('Jornada de Sucesso em 7 Passos', () => {
  test('renderiza os sete pilares na ordem e preserva o tour existente', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const section = page.getByRole('region', { name: 'Jornada de Sucesso em 7 Passos' });
    await expect(section.getByRole('heading', { name: 'Jornada de Sucesso em 7 Passos' })).toBeVisible();
    const titles = await section.locator('ol h3').allTextContents();
    expect(titles).toEqual(expectedTitles);
    await expect(section.locator('ol > li')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: 'Veja como a Brand Page opera na tela do computador' })).toBeAttached();
    for (let index = 0; index < 7; index += 1) {
      await section.locator('ol > li').nth(index).scrollIntoViewIfNeeded();
    }
    const acceptCookies = page.getByRole('button', { name: 'Aceitar' });
    if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: 'test-results/founder-success-journey-mobile.png' });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test('mantém o track e o progresso alinhados na geometria desktop ampla', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const section = page.getByRole('region', { name: 'Jornada de Sucesso em 7 Passos' });
    const track = section.getByTestId('journey-track');
    const progress = section.getByTestId('journey-progress');
    await expect.poll(async () => track.getAttribute('d')).not.toBe('');
    expect(await progress.getAttribute('d')).toBe(await track.getAttribute('d'));
    await expect(section.locator('ol > li')).toHaveCount(7);
    await expect(section.locator('[aria-hidden="false"]')).toContainText('Sua estratégia está em movimento');
    const acceptCookies = page.getByRole('button', { name: 'Aceitar' });
    if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: 'test-results/founder-success-journey-desktop.png' });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test('não cria overflow nas larguras mobile, tablet e desktop', async ({ page }) => {
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });
    for (const width of [360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `overflow horizontal em ${width}px`).toBe(false);
    }
  });
});
