import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const TABS = [
  'overview',
  'analytics',
  'ranking-performance',
  'reviews',
  'review-forms',
  'trust-widget',
  'leads',
  'live-inbox',
  'icp-config',
  'product-general',
  'product-categories',
  'product-catalog',
  'product-downloads',
  'media',
  'product-pricing',
  'product-banner',
  'product-sponsored-description',
  'product-features',
  'integrations',
  'sector-questions',
  'avalia-badges',
  'product-support'
];

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

test.describe('Capture Mobile Views', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Mocking API responses for fast and reliable captures...');
    await mockDashboard(page);
  });

  test('capture all tabs', async ({ page }) => {
    test.setTimeout(240000);

    const outputDir = path.join(process.cwd(), 'artifacts', 'pwa-mobile-views');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Pre-warm the dashboard layout
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    for (const tab of TABS) {
      console.log(`Capturing ${tab}...`);
      await page.goto(`/dashboard?tab=${tab}`);

      // wait for skeleton or loaders to disappear if any
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(outputDir, `${tab}.png`),
        fullPage: false 
      });
    }

    console.log(`All ${TABS.length} tabs captured to ${outputDir}`);
  });
});
