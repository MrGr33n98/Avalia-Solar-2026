import { expect, test } from '@playwright/test';

const baseUrl = process.env.SPEC019_BASE_URL || 'http://127.0.0.1:3100';

test.describe('Catálogo geográfico por superfície', () => {
  test('mobile mantém a geometria e descarta cidades da UF anterior em troca rápida', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const cityResponses: number[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/companies/cities?state='))
        cityResponses.push(response.status());
    });
    await page.goto(`${baseUrl}/companies`, { waitUntil: 'domcontentloaded' });

    const bar = page.getByTestId('mobile-company-filter-bar');
    await expect(bar).toBeVisible({ timeout: 20_000 });
    const quickButtons = await bar
      .locator(':scope > button')
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(quickButtons).toHaveLength(4);
    quickButtons.forEach((height) => expect(height).toBeGreaterThanOrEqual(43));
    quickButtons.forEach((height) => expect(height).toBeLessThanOrEqual(45));

    await bar.getByRole('button', { name: 'Filtros' }).click();
    const drawer = page.getByRole('dialog', { name: 'Filtrar empresas' });
    await expect(drawer).toBeVisible();
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();
    expect(Math.abs(drawerBox!.width - 390 * 0.7)).toBeLessThanOrEqual(1);

    const stateSelect = drawer.locator('#company-filter-state');
    const citySelect = drawer.locator('#company-filter-city');
    await stateSelect.selectOption('SC');
    await stateSelect.selectOption('MT');
    const saoPauloResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/companies/cities?state=SP') && response.status() === 200,
      { timeout: 20_000 }
    );
    await stateSelect.selectOption('SP');
    await expect(citySelect.locator('option')).not.toContainText('Cuiabá');
    await saoPauloResponse;
    await expect(citySelect.locator('option')).toContainText('São Paulo');
    await expect(citySelect.locator('option')).not.toContainText('Florianópolis');
    expect(cityResponses.every((status) => status !== 404)).toBe(true);

    await page.screenshot({ path: 'output/playwright/spec019-mobile-filter.png', fullPage: true });
  });

  test('tablet carrega cidades da UF selecionada e mantém a geometria do controle', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${baseUrl}/companies`, { waitUntil: 'domcontentloaded' });

    const stateSelect = page.getByRole('combobox', { name: 'Filtrar por estado' });
    const citySelect = page.getByRole('combobox', { name: 'Filtrar por cidade' });
    await expect(stateSelect).toBeVisible({ timeout: 20_000 });
    await stateSelect.selectOption('SC');
    await expect(citySelect.locator('option')).toContainText('Florianópolis', { timeout: 20_000 });

    const stateBox = await stateSelect.boundingBox();
    const cityBox = await citySelect.boundingBox();
    expect(stateBox).not.toBeNull();
    expect(cityBox).not.toBeNull();
    expect(stateBox!.height).toBeGreaterThan(38);
    expect(stateBox!.height).toBeLessThan(45);
    expect(cityBox!.height).toBe(stateBox!.height);

    await page.screenshot({ path: 'output/playwright/spec019-tablet-filter.png', fullPage: true });
  });

  test('desktop mostra identidade de cidade e UF no filtro multiestado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/companies`, { waitUntil: 'domcontentloaded' });

    const stateButton = page.getByRole('button', { name: 'SC', exact: true });
    await expect(stateButton).toBeVisible({ timeout: 20_000 });
    await stateButton.click();

    const cityOption = page.locator('button').filter({ hasText: 'Florianópolis' }).first();
    await expect(cityOption).toBeVisible({ timeout: 20_000 });
    await expect(cityOption).toContainText('SC');

    await page.screenshot({ path: 'output/playwright/spec019-desktop-filter.png', fullPage: true });
  });
});
