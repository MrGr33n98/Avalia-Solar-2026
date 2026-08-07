import { test, expect } from '@playwright/test';
import path from 'path';

test('debug blank', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', request => console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText));
  page.on('response', response => {
    if (!response.ok()) console.log('BAD RESPONSE:', response.url(), response.status());
  });

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
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  await page.goto('/dashboard');
  await page.waitForTimeout(5000); // wait and see
  await page.screenshot({ path: path.join(process.cwd(), 'artifacts', 'debug-dashboard.png') });
});
