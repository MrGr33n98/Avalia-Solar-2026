import { expect, test } from '@playwright/test';

test.describe('Reviewer Dashboard Layout and Viewport Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: 'jwt_token', value: 'e2e-reviewer-token', domain: 'localhost', path: '/', httpOnly: true },
    ]);
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            name: 'Reviewer Test',
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
            name: 'Reviewer Test',
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
          kpis: { quotes_total: 2, quotes_open: 1, quotes_replied: 1, reviews_published: 1 },
          gamification: { green_score: 450, regional_ranking: null, achievements: [] },
          impact: { helpful_votes: 12, impacted_people: 120 },
          profile: { completion_percent: 80 },
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
    await page.route('**/api/v1/reviewer_solutions', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route('**/api/v1/reviewer/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, name: 'Reviewer Test', avatar_url: null },
          profile: { profession: 'Projetista solar', company_name: 'Integradora Teste', bio: '' },
        }),
      })
    );
  });

  test('visualização em Desktop (Layout limpo, sem double-wrapping)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/review-dashboard');

    // Sidebar deve ser visível no Desktop
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Container visual único "review-dashboard-enterprise" deve estar presente
    const container = page.locator('.review-dashboard-enterprise');
    await expect(container).toBeVisible();
    await expect(container).toHaveCount(1); // Garante que não há double-container visual
  });

  test('visualização em Mobile (Responsividade e navegação inferior)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/review-dashboard');

    // Sidebar de desktop deve estar oculta ou colapsada
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();

    // Barra de navegação móvel inferior deve ser exibida
    const mobileNav = page.locator('nav').last();
    await expect(mobileNav).toBeVisible();
  });
  test('desktop: identidade real na sidebar e perfil dentro do mesmo shell', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/review-dashboard');

    await expect(page.getByTestId('reviewer-identity-card')).toBeVisible();
    await expect(page.getByText('Projetista solar')).toBeVisible();
    await expect(page.getByText('Integradora Teste')).toBeVisible();

    await page.getByRole('link', { name: 'Detalhes do perfil' }).first().click();
    await expect(page).toHaveURL(/review-dashboard.*profile/);
    await expect(page.getByTestId('reviewer-profile-integrated')).toBeVisible();
    await expect(page.locator('aside[aria-label="Navegação do painel"]')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Seções do perfil' })).toBeVisible();
  });

  test('mobile: perfil no bottom nav, sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/review-dashboard');

    await page.getByRole('link', { name: 'Perfil', exact: true }).first().click();
    await expect(page).toHaveURL(/review-dashboard.*profile/);
    await expect(page.getByTestId('reviewer-profile-integrated')).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });

});
