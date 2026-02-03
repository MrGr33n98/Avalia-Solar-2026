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

    // Mock the validate-token API response
    await page.route('**/api/v1/auth/validate-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'review@example.com',
          name: 'Review User',
          role: 'review',
          status: 'active',
          company_members: []
        }),
      });
    });

    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'review@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check if redirected to review-dashboard
    await expect(page).toHaveURL(/\/review-dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard de Reviewer');
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
