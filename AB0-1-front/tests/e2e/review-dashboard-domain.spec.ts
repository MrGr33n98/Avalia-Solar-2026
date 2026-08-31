import { expect, test } from '@playwright/test';

test.describe('Review Dashboard domínio', () => {
  test.beforeEach(async ({ page }) => {
    await page
      .context()
      .addCookies([
        { name: 'jwt_token', value: 'test-token', domain: 'localhost', path: '/', httpOnly: true },
      ]);
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            name: 'Reviewer',
            email: 'reviewer@example.com',
            role: 'review',
            status: 'active',
          },
        }),
      })
    );
    await page.route('**/api/v1/auth/validate-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            name: 'Reviewer',
            email: 'reviewer@example.com',
            role: 'review',
            status: 'active',
          },
        }),
      })
    );
    await page.route('**/api/v1/review_dashboard/summary', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kpis: {
            quotes_total: 2,
            quotes_open: 1,
            quotes_replied: 1,
            reviews: { total: 1, published: 1, pending: 0, rejected: 0 },
            reviews_published: 1,
          },
          gamification: { green_score: null, regional_ranking: null, achievements: [] },
          impact: { helpful_votes: 0, impacted_people: 0 },
          profile: { completion_percent: 50 },
        }),
      })
    );
    await page.route('**/api/v1/reviews/mine', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    );
    await page.route('**/api/v1/leads/mine', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    );
  });

  test('home não mostra Green Score fictício', async ({ page }) => {
    await page.goto('/review-dashboard');
    await expect(page.getByLabel('Green Score: —')).toBeVisible();
  });

  test('solutions persiste via API', async ({ page }) => {
    const solutions: Array<Record<string, unknown>> = [];
    await page.route('**/api/v1/reviewer_solutions', async (route) => {
      if (route.request().method() === 'GET')
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(solutions),
        });
      const payload = route.request().postDataJSON().solution;
      const item = { id: '1', ...payload, type: payload.solution_type, verified: false };
      solutions.push(item);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(item),
      });
    });
    await page.goto('/review-dashboard/solutions');
    await page.getByRole('button', { name: 'Adicionar solução' }).click();
    await page.getByPlaceholder('Nome da solução').fill('Sistema residencial');
    await page.getByRole('button', { name: 'Adicionar' }).click();
    await expect(page.getByText('Sistema residencial')).toBeVisible();
  });
});
