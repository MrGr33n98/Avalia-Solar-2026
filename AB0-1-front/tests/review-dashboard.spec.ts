import { test, expect } from '@playwright/test';

const reviewer = {
  id: 1,
  email: 'reviewer@avaliasolar.com.br',
  name: 'John Doe',
  role: 'review',
  status: 'active',
};

async function mockReviewerApis(
  page: import('@playwright/test').Page,
  summary: Record<string, unknown> = {}
) {
  await page
    .context()
    .addCookies([
      { name: 'jwt_token', value: 'test-token', domain: 'localhost', path: '/', httpOnly: true },
    ]);
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: reviewer }),
    })
  );
  await page.route('**/api/v1/auth/validate-token', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: reviewer }),
    })
  );
  await page.route('**/api/v1/review_dashboard/summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kpis: {
          quotes_total: 12,
          quotes_open: 5,
          quotes_replied: 7,
          reviews: { total: 101, published: 3, pending: 2, rejected: 0 },
          reviews_published: 3,
        },
        gamification: { green_score: null, regional_ranking: null, achievements: [] },
        profile: { completion_percent: 75 },
        ...summary,
      }),
    })
  );
  await page.route('**/api/v1/reviews/mine', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 1,
            rating: 5,
            comment: 'Ótima empresa!',
            status: 'approved',
            created_at: new Date().toISOString(),
            company: { name: 'Solar Energy' },
          },
        ],
      }),
    })
  );
  await page.route('**/api/v1/leads/mine', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ id: 101, status: 'verified', company: 'Solar Energy' }] }),
    })
  );
  await page.route('**/api/v1/reviewer_solutions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
}

test.describe('Review Dashboard — contrato atual', () => {
  test('home exibe dados reais e null não vira score fictício', async ({ page }) => {
    await mockReviewerApis(page);
    const summaryRequest = page.waitForRequest('**/api/v1/review_dashboard/summary');
    const reviewsRequest = page
      .waitForRequest('**/api/v1/reviews/mine', { timeout: 1000 })
      .catch(() => null);
    await page.goto('/review-dashboard');
    await summaryRequest;
    expect(await reviewsRequest).toBeNull();
    await expect(page.getByText('Meu painel')).toBeVisible();
    await expect(page.getByText('101').first()).toBeVisible();
    await expect(page.getByText('Indisponível').first()).toBeVisible();
    await expect(page.getByText('Ótima empresa!')).toBeVisible();
  });

  test('refresh mantém o dashboard operacional', async ({ page }) => {
    await mockReviewerApis(page, {
      gamification: { green_score: 120, regional_ranking: 4, achievements: [] },
    });
    await page.goto('/review-dashboard');
    await expect(page.getByText('120').first()).toBeVisible();
    await page.getByRole('button', { name: /atualizar|refresh/i }).click();
    await expect(page.getByText('120').first()).toBeVisible();
  });

  test('erro do summary mostra retry sem score fake', async ({ page }) => {
    await mockReviewerApis(page);
    await page.unroute('**/api/v1/review_dashboard/summary');
    await page.route('**/api/v1/review_dashboard/summary', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'indisponível' }),
      })
    );
    await page.goto('/review-dashboard');
    await expect(page.getByRole('button', { name: /tentar novamente/i })).toBeVisible();
    await expect(page.getByText('520')).toHaveCount(0);
  });
});
