import { test, expect } from '@playwright/test';

// Requer sessão CRM real em ambiente de teste; nenhuma API é interceptada.
test.use({ storageState: process.env.CAMPAIGN_E2E_STORAGE_STATE });
for (const [slug, heading] of [['audiences', 'Audiências'], ['templates', 'Templates'], ['sequences', 'Sequências Drip']]) {
  test(`rota estática ${slug} não abre detalhe NaN`, async ({ page }) => {
    const invalidRequests: string[] = [];
    const consoleErrors: string[] = [];
    page.on('request', (request) => { if (/\/campaigns\/(NaN|audiences|templates|sequences)(\?|$)/.test(request.url()) && request.url().includes('/api/')) invalidRequests.push(request.url()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(`/dashboard/sales/campaigns/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/campaigns/${slug}$`));
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.getByText(/Carregando (audiência|templates|sequências)/)).toHaveCount(0, { timeout: 25000 });
    await expect(page.locator('body')).not.toContainText('#NaN');
    expect(invalidRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
    await page.getByRole('navigation', { name: 'Campanhas' }).getByRole('link', { name: 'Campanhas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Campaigns & Outbound Marketing' })).toBeVisible();
  });
}
test('slug inválido encerra carregamento com erro controlado', async ({ page }) => {
  await page.goto('/dashboard/sales/campaigns/banana');
  await expect(page.getByRole('heading', { name: 'Campanha não encontrada' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('#NaN');
  await expect(page.getByText(/Carregando detalhes/)).toHaveCount(0);
});
