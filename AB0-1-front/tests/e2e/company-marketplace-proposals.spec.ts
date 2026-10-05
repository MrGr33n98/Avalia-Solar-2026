import { expect, test, type Page } from '@playwright/test';

const company = {
  id: 101,
  name: 'SB Solar',
  slug: 'sb-solar',
  city: 'São Paulo',
  state: 'SP',
  status: 'active',
  verified: true,
  logo_url: null,
};

const item = {
  id: 1,
  kind: 'service',
  name: 'Sistema fotovoltaico',
  description: 'Instalação completa',
  quantity: 1,
  unit: 'un',
  unit_price_cents: 2690000,
  total_cents: 2690000,
  position: 0,
};

const publishedVersion = {
  id: 1,
  number: 1,
  status: 'published',
  title: 'Proposta comercial',
  summary: 'Condições comerciais e técnicas.',
  total_cents: 2690000,
  currency: 'BRL',
  valid_until: '2026-12-31',
  published_at: '2026-10-01T12:00:00Z',
  items: [item],
  terms: [],
};

const draftVersion = {
  ...publishedVersion,
  id: 2,
  number: 2,
  status: 'draft',
  title: 'Nova versão da proposta',
  summary: 'Ajuste solicitado pelo cliente.',
  published_at: null,
};

const proposal = {
  id: 10,
  reference: 'AS-2026-0010',
  status: 'sent',
  total_cents: 2690000,
  currency: 'BRL',
  created_at: '2026-10-01T12:00:00Z',
  published_at: '2026-10-01T12:00:00Z',
  lead_distribution_id: 50,
  company,
  lead: {
    id: 50,
    name: 'Cliente Teste',
    email: 'cliente@example.com',
    phone: '+5511999999999',
    product_vertical: 'solar',
    project_profile: 'residential',
    city: 'São Paulo',
    state: 'SP',
  },
  version: publishedVersion,
  versions: [publishedVersion],
  project: null,
  meetings: [],
};

async function mockCompanyShell(page: Page) {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  await page.addInitScript(({ activeCompany }) => {
    localStorage.setItem('avalia.auth.session_hint', '1');
    localStorage.setItem('active_company', JSON.stringify(activeCompany));
  }, { activeCompany: company });
  await page.context().addCookies([{ name: 'jwt_token', value: 'e2e-company-token', url: baseUrl }]);

  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 8,
          name: 'Empresa Teste',
          email: 'empresa@example.com',
          role: 'company',
          status: 'active',
        },
      }),
    })
  );
  await page.route('**/api/v1/companies/mine', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([company]) })
  );
  await page.route('**/api/v1/companies/101', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ company }) })
  );
  await page.route('**/api/v1/companies/101/feature_access**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: {} }) })
  );
  await page.route('**/api/v1/company_dashboard/stats**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ stats: {}, feature_access: {}, notifications: [] }),
    })
  );
  await page.route('**/api/v1/company_dashboard/notifications**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [] }) })
  );
  await page.route('**/api/v1/company_dashboard/lead_distributions**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        distributions: [{
          id: 50,
          status: 'accepted',
          assigned_at: '2026-10-01T12:00:00Z',
          lead: proposal.lead,
        }],
      }),
    })
  );
  await page.route('**/api/v1/company_dashboard/proposals?*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ proposals: [proposal] }) })
  );
  await page.route('**/api/v1/company_dashboard/proposals/10/new_version', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        proposal: { ...proposal, status: 'draft', version: draftVersion, versions: [draftVersion, publishedVersion] },
      }),
    })
  );
}

test('empresa recebe proposta publicada e cria nova versão com histórico', async ({ page }) => {
  test.setTimeout(120000);
  await mockCompanyShell(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/dashboard/proposals');

  await expect(page.getByRole('heading', { name: 'Propostas para clientes' })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Cliente Teste').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar nova versão' })).toBeVisible();

  await page.getByRole('button', { name: 'Criar nova versão' }).click();

  await expect(page.getByText('Histórico de versões')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar rascunho' })).toBeVisible();
  await expect(page.getByText('Nova versão da proposta')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('company-proposals-desktop.png'), fullPage: true });

  const hasNoHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  expect(hasNoHorizontalOverflow).toBe(true);
});
