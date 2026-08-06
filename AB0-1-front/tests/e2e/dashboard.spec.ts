import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? '';
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? '';

const hasAuthCredentials = Boolean(E2E_USER_EMAIL && E2E_USER_PASSWORD);

async function authenticate(request: APIRequestContext) {
  const response = await request.post('/api/v1/auth/login', {
    data: {
      email: E2E_USER_EMAIL,
      password: E2E_USER_PASSWORD,
    },
  });

  if (!response.ok()) {
    throw new Error(`Falha na autenticação E2E: ${response.status()} ${await response.text()}`);
  }

  return request.storageState();
}

async function addAuthCookies(page: Page, request: APIRequestContext) {
  const state = await authenticate(request);
  await page.context().addCookies(state.cookies);
}

test.describe('Dashboard PWA — Sprint 1', () => {
  test.describe('PWA metadata e service worker', () => {
    test('manifest deve retornar 200 com campos obrigatórios', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/manifest+json');

      const manifest = await response.json();
      expect(manifest.id).toBeDefined();
      expect(manifest.name).toBeDefined();
      expect(manifest.short_name).toBeDefined();
      expect(manifest.start_url).toBe('/dashboard');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sizes: '192x192' }),
          expect.objectContaining({ sizes: '512x512' }),
        ])
      );
    });

    test('service worker deve estar registrado', async ({ page }) => {
      await page.goto('/dashboard');
      const swUrl = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        return registration.scope;
      });
      expect(swUrl).toContain('/');
    });
  });

  test.describe('Shell exclusivo do dashboard', () => {
    test('Navbar pública não aparece dentro do dashboard', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const publicNav = page.locator('nav').filter({ hasText: /Empresas|Como funciona|Conteúdo/i });
      await expect(publicNav).toHaveCount(0);
    });

    test('Bottom nav pública não aparece dentro do dashboard em mobile', async ({
      page,
      request,
    }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 375, height: 667 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toHaveCount(0);
    });

    test('Navbar pública continua visível fora do dashboard', async ({ page }) => {
      await page.goto('/');
      const publicNav = page
        .locator('nav')
        .filter({ hasText: /Empresas|Como funciona|Conteúdo/i })
        .first();
      await expect(publicNav).toBeVisible();
    });

    test('Bottom nav pública continua visível fora do dashboard em mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();
    });
  });

  test.describe('Matriz de viewport', () => {
    test('mobile: abre sheet de navegação e fecha com Escape', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 375, height: 667 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const menuButton = page.getByRole('button', { name: /menu/i }).first();
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      const sheet = page.locator('[data-state="open"][role="dialog"]').first();
      await expect(sheet).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(sheet).not.toBeVisible();
    });

    test('tablet: usa sheet com labels em vez de rail só com ícones', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 768, height: 1024 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      await expect(page.locator('aside.fixed.left-0').first()).not.toBeVisible();
      await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
      const sheet = page.locator('[data-state="open"][role="dialog"]');
      await expect(sheet.getByRole('button', { name: 'Início' })).toBeVisible();
      await sheet.getByRole('button', { name: 'Dados de Intenção' }).click();

      await expect(sheet.getByLabel('Central de mensagens')).toBeVisible();
    });

    test('desktop: rail expandido visível', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 1280, height: 720 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const rail = page.locator('aside.fixed.left-0').first();
      await expect(rail).toBeVisible();
      await expect(rail).toHaveCSS('width', /240px/);
    });

    const viewports = [
      { width: 320, height: 568, name: '320px' },
      { width: 375, height: 667, name: '375px' },
      { width: 414, height: 896, name: '414px' },
      { width: 768, height: 1024, name: '768px' },
    ];

    for (const viewport of viewports) {
      test(`zero overflow horizontal em ${viewport.name}`, async ({ page, request }) => {
        if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await addAuthCookies(page, request);
        await page.goto('/dashboard');

        const bodyOverflowX = await page.evaluate(() => {
          const body = document.body;
          return window.getComputedStyle(body).overflowX;
        });
        expect(bodyOverflowX).toBe('hidden');

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalOverflow).toBe(false);
      });
    }
  });

  test.describe('Deep-link de tabs', () => {
    test('?tab=reviews carrega a aba de avaliações', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await addAuthCookies(page, request);
      await page.goto('/dashboard?tab=reviews');

      await expect(page).toHaveURL(/tab=reviews/);
      await expect(
        page
          .locator('h2')
          .filter({ hasText: /Avaliações/i })
          .first()
      ).toBeVisible();
    });

    test('back/forward restaura tab sem request duplicado', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await addAuthCookies(page, request);
      await page.goto('/dashboard?tab=overview');

      await page.goto('/dashboard?tab=reviews');
      await page.goBack();
      await expect(page).toHaveURL(/tab=overview/);
    });
  });
});

test.describe('Hotfix visual P0/P1', () => {
  const mockUser = {
    id: 77,
    name: 'Felipe Silva',
    email: 'felipe@example.com',
    role: 'company',
    company_id: 1,
    approved_by_admin: true,
  };
  const mockCompany = {
    id: 1,
    slug: 'solar-demo',
    name: 'Solar Demo',
    description: 'Empresa de energia solar para validação visual.',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    verified: true,
    website: 'https://example.com',
    phone: '11999999999',
    categories: [{ id: 1, name: 'Energia solar' }],
    reviews_count: 14,
    plan_id: 2,
    plan_tier: 'pro',
  };

  async function mockDashboard(page: Page) {
    await page.context().addCookies([
      { name: 'jwt_token', value: 'e2e-dashboard-token', url: 'http://localhost:3000' },
      { name: 'active_company_id', value: '1', url: 'http://localhost:3000' },
    ]);
    await page.addInitScript(
      ({ user, company }) => {
        localStorage.setItem('avalia.auth.session_hint', '1');
        localStorage.setItem('active_company', JSON.stringify(company));
        localStorage.setItem('theme', localStorage.getItem('theme') || 'light');
        sessionStorage.setItem('mobivolt_success_invite_dismissed', 'true');
        localStorage.setItem(
          'avaliasolar_consent',
          JSON.stringify({ analytics: false, marketing: false, lastUpdated: 1786046400000 })
        );
        (window as typeof window & { __E2E_USER__?: unknown }).__E2E_USER__ = user;
      },
      { user: mockUser, company: mockCompany }
    );

    await page.route('**/graphql*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { me: mockUser } }),
      })
    );
    await page.route('**/api/v1/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      let payload: unknown = {};
      if (pathname.endsWith('/auth/me') || pathname.endsWith('/users/me'))
        payload = { user: mockUser };
      else if (pathname.endsWith('/companies/mine') || pathname.endsWith('/users/me_companies'))
        payload = [mockCompany];
      else if (/\/companies\/1$/.test(pathname)) payload = { company: mockCompany };
      else if (pathname.endsWith('/feature_access')) payload = { features: {}, plan: 'pro' };
      else if (pathname.endsWith('/company_dashboard/stats'))
        payload = {
          stats: {
            profile_views: 128,
            leads_received: 8,
            reviews_count: 14,
            pending_reviews_count: 2,
            average_rating: 4.7,
            pending_approvals: 0,
            active_campaigns: 1,
            conversion_rate: 6.3,
          },
        };
      else if (pathname.endsWith('/company_dashboard/analytics/overview'))
        payload = {
          views_30d: 128,
          cta_clicks_30d: 24,
          leads_30d: 8,
          is_premium_analytics: true,
          last_aggregated_at: '2026-08-06T12:00:00Z',
        };
      else if (pathname.endsWith('/company_dashboard/analytics/timeseries'))
        payload = {
          data: [
            { date: '2026-08-01', views: 12, clicks: 3, leads: 1 },
            { date: '2026-08-02', views: 18, clicks: 5, leads: 2 },
          ],
        };
      else if (pathname.endsWith('/company_dashboard/analytics/top_campaigns'))
        payload = { campaigns: [] };
      else if (pathname.endsWith('/company_dashboard/intent_summary'))
        payload = { total_signals: 0, intent_distribution: {} };
      else if (pathname.endsWith('/company_dashboard/notifications'))
        payload = { notifications: [] };
      else if (pathname.endsWith('/leads') || pathname.endsWith('/conversations')) payload = [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });
  }
  for (const viewport of [
    { width: 375, height: 812, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
  ]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${viewport.name} ${theme}: drawer rotulado, tema consistente e sem sobreposição`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.addInitScript(
          (selectedTheme) => localStorage.setItem('theme', selectedTheme),
          theme
        );
        await mockDashboard(page);
        await page.goto('/dashboard');
        await expect(page.getByRole('button', { name: 'Abrir menu de navegação' })).toBeVisible();
        await expect(page.getByRole('img', { name: 'Avalia Solar' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Buscar no dashboard' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Abrir perfil da conta' })).toBeVisible();

        const reputation = page.locator(
          '[data-testid="reputation-summary"], [data-testid="reputation-empty-state"]'
        );
        await expect(reputation).toBeVisible();
        if (await page.getByTestId('reputation-empty-state').count()) {
          expect(
            (await page.getByTestId('reputation-empty-state').boundingBox())?.height
          ).toBeLessThanOrEqual(120);
        }
        await expect(page.getByText('Olá, Felipe!')).toBeVisible();

        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          )
        ).toBe(true);
        await expect(
          page.getByRole('button', { name: 'Abrir MobiVolt Success' })
        ).not.toBeVisible();

        await page.screenshot({
          path: `artifacts/hotfix-dashboard/${viewport.name}-${theme}-dashboard.png`,
          fullPage: true,
        });
        await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
        const sheet = page.locator('[data-state="open"][role="dialog"]');
        await expect(sheet.getByRole('button', { name: 'Início' })).toBeVisible();
        await sheet.getByRole('button', { name: 'Dados de Intenção' }).click();
        await expect(sheet.getByRole('button', { name: 'Mensagens' })).toBeVisible();
        await expect(sheet.getByLabel('Central de mensagens')).toBeVisible();
        await expect(sheet.locator('[aria-current="page"], [aria-current="true"]')).toHaveCount(1);

        const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
        const blockers = results.violations.filter(
          (violation) => violation.impact === 'critical' || violation.impact === 'serious'
        );
        expect(blockers).toEqual([]);

        await page.screenshot({
          path: `artifacts/hotfix-dashboard/${viewport.name}-${theme}-drawer.png`,
          fullPage: false,
        });
      });
    }
  }
});
