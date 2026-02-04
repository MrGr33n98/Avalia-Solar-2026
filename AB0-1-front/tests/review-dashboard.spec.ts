import { test, expect } from '@playwright/test';

test.describe('Review Dashboard functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    // Collect console logs for debugging
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Set mock JWT cookie to bypass middleware
    await context.addCookies([
      {
        name: 'jwt_token',
        value: 'mock-token-for-testing',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Mock the auth/me API response for a review user
    await page.route('**/api/v1/auth/me', async (route) => {
      console.log(`[MOCK] Intercepted auth/me: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            email: 'reviewer@avaliasolar.com.br',
            name: 'John Doe',
            role: 'review',
            status: 'active'
          }
        }),
      });
    });

    // Mock the validate-token API response (using auth/me as it is used in AuthContext)
    await page.route('**/api/v1/auth/validate-token', async (route) => {
      console.log(`[MOCK] Intercepted validate-token: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            email: 'reviewer@avaliasolar.com.br',
            name: 'John Doe',
            role: 'review',
            status: 'active'
          }
        }),
      });
    });

    // Mock states API to prevent 500 errors in browser
      await page.route('**/api/v1/states', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      // Mock companies/states API to prevent 500 errors in browser
      await page.route('**/api/v1/companies/states', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      // Mock categories/tree API
      await page.route('**/api/v1/categories/tree', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

    // Mock summary API
    await page.route('**/api/v1/review_dashboard/summary', async (route) => {
      console.log(`[MOCK] Intercepted summary: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kpis: {
            quotes_total: 12,
            quotes_open: 5,
            quotes_replied: 7,
            reviews_published: 3
          },
          charts: {
            activity_30d: [
              { date: '2026-01-01', profile_views: 10, whatsapp_clicks: 2, cta_clicks: 1 },
              { date: '2026-01-15', profile_views: 25, whatsapp_clicks: 5, cta_clicks: 3 },
              { date: '2026-02-01', profile_views: 15, whatsapp_clicks: 1, cta_clicks: 0 }
            ]
          },
          profile: {
            completion_percent: 75
          }
        }),
      });
    });

    // Mock reviews API
    await page.route('**/api/v1/reviews/mine', async (route) => {
      console.log(`[MOCK] Intercepted reviews/mine: ${route.request().url()}`);
      await route.fulfill({
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
              company: { name: 'Solar Energy', logo_url: null }
            }
          ]
        }),
      });
    });

    // Mock leads API
    await page.route('**/api/v1/leads/mine', async (route) => {
      console.log(`[MOCK] Intercepted leads/mine: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 101,
              company: 'Solar Energy',
              status: 'verified',
              created_at: new Date().toISOString(),
              category: 'Residencial',
              product_vertical: 'Residencial'
            }
          ]
        }),
      });
    });
  });

  test('should load dashboard with correct data and tracking', async ({ page }) => {
    await page.goto('/review-dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Debug current URL and content
    console.log(`[TEST DEBUG] Current URL: ${page.url()}`);
    const h1Count = await page.locator('h1').count();
    console.log(`[TEST DEBUG] H1 Count: ${h1Count}`);
    for (let i = 0; i < h1Count; i++) {
      console.log(`[TEST DEBUG] H1 ${i}: ${await page.locator('h1').nth(i).innerText()}`);
    }

    // Check title and user info
    await expect(page.locator('h1').filter({ hasText: 'Meu Painel' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('John Doe')).toBeVisible();

    // Check KPI cards
    await expect(page.getByText('Orçamentos solicitados')).toBeVisible();
    await expect(page.locator('section').filter({ hasText: 'Orçamentos solicitados' }).getByText('12')).toBeVisible();
    await expect(page.getByText('Reviews publicadas')).toBeVisible();
    await expect(page.locator('section').filter({ hasText: 'Reviews publicadas' }).getByText('3')).toBeVisible();

    // Check Quick Actions
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('75%')).toBeVisible(); // Profile completion

    // Check Quotes Panel
    await expect(page.getByText('Solar Energy').first()).toBeVisible();
    await expect(page.getByText('Residencial')).toBeVisible();

    // Check Reviews List
    await expect(page.getByText('Ótima empresa!')).toBeVisible();

    // Verify refreshing works
    await page.click('button:has(.lucide-refresh-ccw)');
    // After refresh, the data should still be there
    await expect(page.locator('section').filter({ hasText: 'Orçamentos solicitados' }).getByText('12')).toBeVisible();
  });

  test('should handle tab changes in quotes panel', async ({ page }) => {
    await page.goto('/review-dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Default tab is 'all' (Todos)
    await expect(page.getByRole('tab', { name: 'Todos' })).toBeVisible({ timeout: 20000 });
    
    // Click on 'Abertos' tab
    await page.click('button[role="tab"]:has-text("Abertos")');
    await expect(page.getByRole('tab', { name: 'Abertos' })).toHaveAttribute('data-state', 'active');
  });

  test('should handle unauthorized access by redirecting', async ({ page }) => {
    // Remove the default mock to replace it
    await page.unroute('**/api/v1/auth/me');
    
    // Mock unauthorized role
    await page.route('**/api/v1/auth/me', async (route) => {
      console.log(`[MOCK] Intercepted unauthorized auth/me: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 2,
            email: 'company@avaliasolar.com.br',
            name: 'Company Admin',
            role: 'company',
            status: 'active'
          }
        }),
      });
    });

    await page.goto('/review-dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Should redirect to company-dashboard
    await expect(page).toHaveURL(/\/company-dashboard/, { timeout: 20000 });
  });
});
