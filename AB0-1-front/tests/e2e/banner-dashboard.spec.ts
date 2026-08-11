import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL ?? '';
const password = process.env.E2E_USER_PASSWORD ?? '';

async function authenticate(request: APIRequestContext) {
  const response = await request.post('/api/v1/auth/login', { data: { email, password } });
  if (!response.ok()) throw new Error(`Falha na autenticação E2E: ${response.status()}`);
  return request.storageState();
}

async function prepare(page: Page, request: APIRequestContext) {
  const state = await authenticate(request);
  await page.context().addCookies(state.cookies);
  await page.route('**/api/v1/company_dashboard/banners**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        quota: { used: 1, limit: 3, remaining: 2, can_create: true },
        summary: {
          impressions: 1200,
          clicks: 48,
          ctr: 4,
          leads: 6,
          investment_cents: 25000,
          cpc_cents: 520,
        },
        operational_health: {
          status: 'healthy',
          reportable_events_24h: 48,
          discarded_events_24h: 0,
          divergent_banners_yesterday: 0,
          lag_minutes: 4,
        },
        time_series: [
          { day: '2026-08-08', impressions: 320, clicks: 12 },
          { day: '2026-08-09', impressions: 410, clicks: 17 },
          { day: '2026-08-10', impressions: 470, clicks: 19 },
        ],
        banners: [],
      }),
    });
  });
}

test.describe('Banner Ads dashboard visual smoke', () => {
  test.beforeEach(async ({ page, request }) => {
    test.skip(!email || !password, 'Credenciais E2E ausentes');
    await prepare(page, request);
  });

  test('renderiza KPIs e saúde da medição sem overflow horizontal', async ({ page }) => {
    await page.goto('/dashboard?company_id=1&tab=product-banner');
    await expect(page.getByText('Campanhas patrocinadas', { exact: false })).toBeVisible();
    await expect(page.getByText('Saúde da medição')).toBeVisible();
    await expect(page.getByText('Operação normal')).toBeVisible();
    await expect(page.getByText('Eventos válidos 24h:')).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('expõe as ações e os cards principais do mockup', async ({ page }) => {
    await page.goto('/dashboard?company_id=1&tab=product-banner');

    await expect(page.getByRole('button', { name: 'Nova campanha' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guia rápido' })).toBeVisible();
    await expect(page.getByText('Quota de campanhas')).toBeVisible();
    await expect(page.getByText('Dica de boas práticas')).toBeVisible();

    await page.getByRole('button', { name: 'Guia rápido' }).click();
    await expect(page.getByRole('dialog')).toContainText('Guia rápido de campanhas');
    await page.getByRole('button', { name: 'Fechar' }).click();
  });

  test('permite alternar o período do gráfico', async ({ page }) => {
    await page.goto('/dashboard?company_id=1&tab=product-banner');

    const period = page.getByRole('combobox', { name: 'Período do gráfico' });
    await expect(period).toBeVisible();
    await period.click();
    await page.getByRole('option', { name: 'Últimos 7 dias' }).click();
    await expect(period).toContainText('Últimos 7 dias');
  });

  test('mantém o painel operacional legível no viewport atual', async ({ page }) => {
    await page.goto('/dashboard?company_id=1&tab=product-banner');
    const health = page.getByText('Saúde da medição').locator('..').locator('..');
    await expect(health).toBeVisible();
    await expect(health).toHaveCSS('min-height', /./);
  });
});
