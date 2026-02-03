import { test, expect } from '@playwright/test';

test.describe('Authentication and Navigation Flow', () => {
  test('review user should be redirected to review-dashboard after login', async ({ page }) => {
    // Mock the login API response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-jwt-token',
          user: {
            id: 1,
            email: 'review@example.com',
            name: 'Review User',
            role: 'review',
            status: 'active'
          }
        }),
      });
    });

    // Mock the validate-token API response (using auth/me as it is used in AuthContext)
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            email: 'review@example.com',
            name: 'Review User',
            role: 'review',
            status: 'active'
          }
        }),
      });
    });

    // Mock dashboard data
    await page.route('**/api/v1/reviews/mine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/api/v1/leads/mine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'review@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check if redirected to review-dashboard
    await expect(page).toHaveURL(/\/review-dashboard/);
    await expect(page.locator('h1')).toContainText('Meu Painel');

    // Test redirection for "Minha conta" link in navbar
    await page.click('a:has-text("Minha conta")');
    await expect(page).toHaveURL(/\/review-dashboard/);
  });

  test('review user can access select-company to request company administration', async ({ page }) => {
    // Mock the auth/me API response for a review user
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            email: 'review@example.com',
            name: 'Review User',
            role: 'review',
            status: 'active'
          }
        }),
      });
    });

    // Mock company access context
    await page.route('**/api/v1/company-access/context', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          active_memberships: [],
          pending_requests: [],
          suggested_companies: [
            { id: 101, name: 'Solar Tech', slug: 'solar-tech' }
          ]
        }),
      });
    });

    await page.goto('/select-company');
    
    // Should NOT be redirected back to review-dashboard anymore
    await expect(page).toHaveURL(/\/select-company/);
    await expect(page.locator('h1')).toContainText('Selecione sua empresa');
    
    // Check if suggested company is visible
    await expect(page.locator('text=Solar Tech')).toBeVisible();
  });

  test('company user without company should be redirected to select-company', async ({ page }) => {
    // Mock the login API response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-jwt-token',
          user: {
            id: 2,
            email: 'company@example.com',
            name: 'Company User',
            role: 'company',
            status: 'active'
          }
        }),
      });
    });

    // Mock the validate-token API response
    await page.route('**/api/v1/auth/validate-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          email: 'company@example.com',
          name: 'Company User',
          role: 'company',
          status: 'active',
          company_members: []
        }),
      });
    });

    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'company@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check if redirected to select-company
    await expect(page).toHaveURL(/\/select-company/);
  });
});
