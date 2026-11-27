/**
 * Spec 022 — jornadas críticas do workspace empresarial com tenants sintéticos.
 *
 * Todo `/api/v1/**` é respondido no navegador por fixtures (FIXTURE Solar A/B,
 * ids 9001/9002) e o WebSocket é mockado. O cookie `jwt_token` é sintético: o
 * middleware só verifica presença. Nenhuma credencial ou dado real é usado.
 * Valida o front (roteamento, abas, isolamento de tenant na UI); autorização
 * real do backend continua coberta pelos request specs do Rails.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test';

const COMPANY_A = { id: 9001, name: 'FIXTURE Solar A' };
const COMPANY_B = { id: 9002, name: 'FIXTURE Solar B' };
const FEATURE_KEYS = [
  'advanced_analytics',
  'ai_live_inbox',
  'company_ai_assistant',
  'downloadable_materials',
  'leads_marketplace',
  'media_gallery',
  'notifications',
  'promo_banner',
  'sponsored_description',
  'webhooks',
  'intent_scores',
];

// Abas do EnterpriseDashboard (TabsContent) + aliases legados.
const DASHBOARD_TABS = [
  'overview',
  'ranking-performance',
  'style-analysis',
  'integrations',
  'marketing-widgets',
  'trust-widget',
  'avalia-badges',
  'tracking-attribution',
  'analytics',
  'benchmark',
  'ai-assistant',
  'product-general',
  'product-categories',
  'product-pricing',
  'product-support',
  'product-banner',
  'product-sponsored-description',
  'product-catalog',
  'product-downloads',
  'materials',
  'product-features',
  'product-videos',
  'product-images',
  'categories',
  'products',
  'reviews',
  'review-forms',
  'sector-questions',
  'media',
  'leads',
  'approvals',
  'campaigns',
  'settings',
  'team-management',
  'buyer-intent',
  'info',
  'prospects',
  'track-your-prospects',
  'buyer_intent',
];

const company = (base: { id: number; name: string }) => ({
  ...base,
  slug: `fixture-${base.id}`,
  city: 'Florianópolis',
  state: 'SC',
  status: 'active',
  logo_url: null,
  plan: 'pro',
  plan_tier: 'pro',
  role: 'owner',
  membership_role: 'owner',
  verified: true,
  rating_average: null,
  reviews_count: 0,
});

type FixtureOptions = { slowCompanyA?: number; selectActiveStatus?: number };

function fixtureFor(pathname: string, method: string) {
  const p = pathname.replace(/^.*\/api\/v1/, '');
  if (p === '/auth/me') {
    return {
      user: {
        id: 1,
        name: 'FIXTURE Owner',
        email: 'owner@fixture.invalid',
        role: 'company',
        company_id: COMPANY_A.id,
        status: 'active',
        approved_by_admin: true,
      },
    };
  }
  if (p === '/companies/mine' || p === '/users/me_companies') return [company(COMPANY_A), company(COMPANY_B)];
  let m = p.match(/^\/companies\/(\d+)\/feature_access$/);
  if (m) {
    return {
      plan: 'pro',
      subscription: { status: 'active' },
      features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, { state: 'enabled' }])),
    };
  }
  m = p.match(/^\/companies\/(\d+)$/);
  if (m) return company(Number(m[1]) === COMPANY_B.id ? COMPANY_B : COMPANY_A);
  // Respostas vazias, mas no contrato tipado em lib/api*.ts: vários workspaces quebram
  // o dashboard inteiro se a chave esperada vier ausente (fragilidade já existente).
  if (p.includes('company_webhooks')) return { webhooks: [] };
  if (p === '/company_dashboard/banners') {
    return {
      quota: { active_used: 0, active_limit: 1, active_remaining: 1, can_activate: true, can_create_draft: true },
      summary: { impressions: 0, clicks: 0, ctr: 0, leads: 0 },
      placements: [],
      banners: [],
      time_series: [],
    };
  }
  if (p === '/company_dashboard/banners/export_alerts') return { alerts: [] };
  if (p === '/company_admin/review_forms') {
    return { review_forms: [], summary: { recent_forms_count: 0, recent_reviews_count: 0, approved_reviews_count: 0 } };
  }
  if (p === '/company_dashboard/analytics/prospects') {
    return {
      status: 'empty',
      range: { from: '2026-10-28', to: '2026-11-26' },
      summary: {
        clicks: 0, verified_landings: 0, form_submissions: 0, confirmed_conversions: 0,
        landing_rate: null, conversion_rate: null, form_observation_rate: null,
        trends: { clicks_change_pct: null, landings_change_pct: null, conversions_change_pct: null, form_submissions_change_pct: null },
      },
      timeseries: [],
      source_breakdown: [],
      records: [],
      pagination: { current_page: 1, per_page: 25, total_count: 0, total_pages: 0 },
      tag_info: { configured: false, status: 'not_configured' },
      integrations: { ga4: { status: 'not_configured' }, custom_ids: { allowed_keys: [], enabled: false } },
    };
  }
  if (p.includes('/leads')) return [];
  if (p.includes('notifications')) return { notifications: [] };
  if (p.includes('top_campaigns')) return { campaigns: [] };
  if (p.includes('timeseries')) return { series: [] };
  if (method !== 'GET') return { ok: true };
  return {};
}

async function setupWorkspace(context: BrowserContext, page: Page, baseURL: string, opts: FixtureOptions = {}) {
  await context.routeWebSocket(/.*/, (ws) => ws.close());
  await context.addCookies([{ name: 'jwt_token', value: 'fixture-not-a-real-token', url: baseURL }]);
  await context.addInitScript(() => {
    localStorage.setItem('avalia.auth.session_hint', '1');
    localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true }));
  });

  const errors: string[] = [];
  const rscRequests: string[] = [];
  const selectActiveCalls: number[] = [];
  const companyIdsRequested = new Set<number>();
  page.on('pageerror', (e) => errors.push(e.message));
  // Mismatch de hidratação (React 18 minificado: #418/#423/#425) também conta como erro.
  page.on('console', (m) => {
    if (m.type() === 'error' && /hydrat|did not match|#418|#423|#425/i.test(m.text())) errors.push(m.text());
  });

  await page.route('**/*', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const isApi = url.pathname.includes('/api/v1/');
    if (isApi) {
      const companyMatch = url.pathname.match(/\/companies\/(\d+)/);
      if (companyMatch) companyIdsRequested.add(Number(companyMatch[1]));
      const queryCompany = Number(url.searchParams.get('company_id'));
      if (queryCompany) companyIdsRequested.add(queryCompany);
      if (/select_active_company|active_company/.test(url.pathname)) {
        const body = req.postDataJSON?.() as { company_id?: number } | null;
        selectActiveCalls.push(Number(body?.company_id ?? 0));
        const status = opts.selectActiveStatus ?? 200;
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: status < 400 }) });
      }
      if (opts.slowCompanyA && url.pathname.endsWith(`/companies/${COMPANY_A.id}`)) {
        await new Promise((r) => setTimeout(r, opts.slowCompanyA));
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtureFor(url.pathname, req.method())),
      });
    }
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    // Prefetch de <Link> (header Next-Router-Prefetch) não é navegação.
    if (url.searchParams.has('_rsc') && !req.headers()['next-router-prefetch']) {
      rscRequests.push(url.pathname + url.search);
    }
    return route.continue();
  });

  return { errors, rscRequests, selectActiveCalls, companyIdsRequested };
}

/** Shell do workspace pronto: seletor de empresa mostra o tenant ativo. */
async function waitForShell(page: Page, companyName: string) {
  // No mobile o seletor de empresa fica no drawer: o painel ativo também marca o shell pronto.
  await expect(
    page.locator('[aria-label="Alternar Empresa"], [role="tabpanel"]').first()
  ).toBeAttached({ timeout: 45_000 });
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    await expect(page.getByText(companyName).first()).toBeVisible({ timeout: 45_000 });
  }
}

async function expectNoCrash(page: Page, errors: string[]) {
  await expect(page.getByText('Erro Crítico')).toHaveCount(0);
  await expect(page.getByText('Erro no Dashboard')).toHaveCount(0);
  expect(errors.filter((e) => /Minified React error #185|Maximum update depth|hydrat|did not match|#418|#423|#425/i.test(e))).toEqual([]);
}

test.describe('Workspace empresarial — fixtures A/B', () => {
  test('carrega a Visão Geral da empresa da URL', async ({ context, page, baseURL }) => {
    const { errors } = await setupWorkspace(context, page, baseURL!);
    await page.goto(`/dashboard?company_id=${COMPANY_A.id}`);
    await waitForShell(page, COMPANY_A.name);
    await expect(page.locator('[role="tabpanel"]').first()).toBeVisible({ timeout: 30_000 });
    await expectNoCrash(page, errors);
  });

  test('?tab=info abre Informações gerais sem Erro Crítico (D0 H05b)', async ({ context, page, baseURL }) => {
    const { errors } = await setupWorkspace(context, page, baseURL!);
    await page.goto(`/dashboard?company_id=${COMPANY_A.id}&tab=info`);
    await waitForShell(page, COMPANY_A.name);
    await page.waitForTimeout(2000);
    await expectNoCrash(page, errors);
    expect(new URL(page.url()).searchParams.get('company_id')).toBe(String(COMPANY_A.id));
  });

  test('todas as abas abrem por deep link sem quebrar', async ({ context, page, baseURL }) => {
    test.setTimeout(120_000 + DASHBOARD_TABS.length * 20_000);
    const { errors } = await setupWorkspace(context, page, baseURL!);
    const failures: string[] = [];
    for (const tab of DASHBOARD_TABS) {
      await page.goto(`/dashboard?company_id=${COMPANY_A.id}&tab=${tab}`);
      await waitForShell(page, COMPANY_A.name).catch(() => failures.push(`${tab} (shell)`));
      await page.waitForTimeout(800);
      const crashed =
        (await page.getByText('Erro Crítico').count()) > 0 ||
        (await page.getByText('Erro no Dashboard').count()) > 0;
      const loop = errors.some((e) => /#185|Maximum update depth/.test(e));
      if (crashed || loop) failures.push(tab);
      errors.length = 0;
    }
    expect(failures).toEqual([]);
  });

  test('troca de aba pela navegação não faz round trip RSC (D0 H05a)', async ({ context, page, baseURL }) => {
    const { errors, rscRequests } = await setupWorkspace(context, page, baseURL!);
    await page.goto(`/dashboard?company_id=${COMPANY_A.id}`);
    await waitForShell(page, COMPANY_A.name);
    await page.waitForLoadState('networkidle').catch(() => undefined);

    const before = rscRequests.length;
    await page.evaluate(() => {
      // Mesmo caminho do handler: history integrado ao App Router.
      window.history.pushState(null, '', `${location.pathname}?company_id=9001&tab=reviews`);
    });
    await page.waitForTimeout(1500);
    expect(new URL(page.url()).searchParams.get('tab')).toBe('reviews');
    // Só RSC de navegação para o próprio /dashboard indica round trip da troca de aba.
    const tabSwitchRsc = rscRequests.slice(before).filter((u) => u.split('?')[0] === '/dashboard');
    expect(tabSwitchRsc).toEqual([]);

    await page.goBack();
    await page.waitForTimeout(800);
    expect(new URL(page.url()).searchParams.get('tab')).not.toBe('reviews');
    await expectNoCrash(page, errors);
  });

  test('company_id fora das associações não abre o tenant (IDOR na UI)', async ({ context, page, baseURL }) => {
    const { errors, companyIdsRequested, selectActiveCalls } = await setupWorkspace(context, page, baseURL!);
    await page.goto('/dashboard?company_id=777777');
    await expect
      .poll(() => new URL(page.url()).searchParams.get('company_id'), { timeout: 45_000 })
      .not.toBe('777777');
    await page.waitForTimeout(2000);
    // Nenhuma chamada de API e nenhuma seleção para o tenant não associado.
    expect([...companyIdsRequested]).not.toContain(777777);
    expect(selectActiveCalls).not.toContain(777777);
    await expect(page.locator('main')).not.toContainText('777777');
    await expectNoCrash(page, errors);
  });

  test('resposta atrasada de A não aparece depois de abrir B (D0 H03)', async ({ context, page, baseURL }) => {
    const { errors } = await setupWorkspace(context, page, baseURL!, { slowCompanyA: 3000 });
    await page.goto(`/dashboard?company_id=${COMPANY_A.id}`);
    await page.waitForTimeout(500);
    await page.goto(`/dashboard?company_id=${COMPANY_B.id}`);
    await waitForShell(page, COMPANY_B.name);
    await page.waitForTimeout(3500);
    await expect(page.locator('main')).not.toContainText(COMPANY_A.name);
    await expectNoCrash(page, errors);
  });

  test('só o painel da aba ativa fica no DOM (Spec 022 Fase C)', async ({ context, page, baseURL }) => {
    const { errors } = await setupWorkspace(context, page, baseURL!);
    await page.goto(`/dashboard?company_id=${COMPANY_A.id}`);
    await waitForShell(page, COMPANY_A.name);
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(1);
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute('data-tab', 'overview');
    await expect(page.locator('[data-tour="overview"]')).toHaveCount(1);
    await expectNoCrash(page, errors);
  });

  test('deep link com alias abre o painel canônico correto', async ({ context, page, baseURL }) => {
    const { errors } = await setupWorkspace(context, page, baseURL!);
    for (const [alias, canonical] of [
      ['info', 'product-general'],
      ['prospects', 'tracking-attribution'],
      ['buyer_intent', 'buyer-intent'],
    ]) {
      await page.goto(`/dashboard?company_id=${COMPANY_A.id}&tab=${alias}`);
      await waitForShell(page, COMPANY_A.name);
      await expect(page.locator('[role="tabpanel"]')).toHaveAttribute('data-tab', canonical, { timeout: 15_000 });
      await expect(page.locator('[role="tabpanel"]')).toHaveCount(1);
    }
    await expectNoCrash(page, errors);
  });

  test('clique na sidebar troca o painel e voltar/avançar restauram o conteúdo', async ({ context, page, baseURL }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'sidebar fixa só a partir de md');
    const { errors } = await setupWorkspace(context, page, baseURL!);
    await page.goto(`/dashboard?company_id=${COMPANY_A.id}`);
    await waitForShell(page, COMPANY_A.name);
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute('data-tab', 'overview');

    await page.locator('aside').getByRole('button', { name: 'Integrações', exact: true }).first().click();
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute('data-tab', 'integrations');
    expect(new URL(page.url()).searchParams.get('tab')).toBe('integrations');

    await page.goBack();
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute('data-tab', 'overview');
    await page.goForward();
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute('data-tab', 'integrations');
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(1);
    await expectNoCrash(page, errors);
  });
});
