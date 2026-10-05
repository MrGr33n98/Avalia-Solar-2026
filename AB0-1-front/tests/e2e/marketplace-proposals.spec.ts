import { expect, test, type Page } from '@playwright/test';

const version = (number: number, totalCents: number) => ({
  id: number,
  number,
  status: 'published',
  title: `Versão ${number} da proposta`,
  summary: `Condições comerciais da versão ${number}.`,
  total_cents: totalCents,
  currency: 'BRL',
  valid_until: '2026-12-31',
  published_at: `2026-10-0${number}T12:00:00Z`,
  items: [
    {
      id: number,
      kind: 'service',
      name: 'Sistema fotovoltaico',
      description: 'Instalação completa',
      quantity: 1,
      unit: 'un',
      unit_price_cents: totalCents,
      total_cents: totalCents,
      position: 0,
    },
  ],
  terms: [],
});

const proposals = [
  {
    id: 10,
    reference: 'AS-2026-0010',
    status: 'sent',
    total_cents: 2690000,
    currency: 'BRL',
    created_at: '2026-10-01T12:00:00Z',
    published_at: '2026-10-01T12:00:00Z',
    company: { id: 101, name: 'SB Solar', logo_url: null },
    request: { id: 50, vertical: 'solar', project_profile: 'residential', city: 'São Paulo', state: 'SP' },
    version: version(2, 2690000),
    versions: [version(2, 2690000), version(1, 2850000)],
    project: null,
    meetings: [],
  },
  {
    id: 11,
    reference: 'AS-2026-0011',
    status: 'viewed',
    total_cents: 2850000,
    currency: 'BRL',
    created_at: '2026-10-02T12:00:00Z',
    published_at: '2026-10-02T12:00:00Z',
    company: { id: 102, name: 'Energia SC', logo_url: null },
    request: { id: 50, vertical: 'solar', project_profile: 'residential', city: 'São Paulo', state: 'SP' },
    version: version(1, 2850000),
    versions: [version(1, 2850000)],
    project: null,
    meetings: [],
  },
];

async function mockReviewerShell(page: Page) {
  await page.addInitScript(() => localStorage.setItem('avalia.auth.session_hint', '1'));
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  await page.context().addCookies([{ name: 'jwt_token', value: 'e2e-test-token', url: baseUrl }]);
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 7,
          name: 'Cliente Teste',
          email: 'cliente@example.com',
          role: 'review',
          status: 'active',
        },
      }),
    })
  );
  await page.route('**/api/v1/reviewer/profile', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile: null }) })
  );
  await page.route('**/api/v1/review_dashboard/summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kpis: { quotes_total: 2, quotes_open: 2, quotes_replied: 2, reviews_published: 0 },
        gamification: { green_score: 0, regional_ranking: null, achievements: [] },
        impact: { helpful_votes: 0, impacted_people: 0 },
        profile: { completion_percent: 100 },
      }),
    })
  );
  await page.route('**/api/v1/reviews/mine', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
  );
  await page.route('**/api/v1/leads/mine', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
  );
  await page.route('**/api/v1/reviewer_solutions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
}

test.describe('Jornada de propostas do marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await mockReviewerShell(page);
    await page.route('**/api/v1/proposals', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ proposals }) })
    );
    await page.route('**/api/v1/proposals/*/view', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ proposal: proposals[0] }) })
    );
  });

  test('mostra múltiplas propostas, comparação e histórico de negociação no mobile', async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/review-dashboard/proposals');

    await expect(page.getByRole('heading', { name: 'Minhas propostas' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'SB Solar' })).toBeVisible();
    await expect(page.getByRole('button', { name: /ES Energia SC/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Histórico de versões' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Versão 2 da proposta' })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('consumer-proposals-mobile.png'), fullPage: true });

    await page.getByLabel('Comparar proposta').nth(0).check();
    await page.getByLabel('Comparar proposta').nth(1).check();
    await page.getByRole('button', { name: /Comparar selecionadas \(2\)/ }).click();
    await expect(page.getByRole('heading', { name: 'Comparar propostas' })).toBeVisible();
    await expect(page.getByText('SB Solar').last()).toBeVisible();

    const hasNoHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(hasNoHorizontalOverflow).toBe(true);
  });
});
