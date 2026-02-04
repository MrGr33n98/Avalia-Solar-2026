import { test, expect } from '@playwright/test';

test.describe('Redirection Loop and 401 Handling', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
  });

  test('should handle redirect parameter correctly after login', async ({ page, context }) => {
    // Set a dummy cookie so middleware doesn't redirect /review-dashboard
    await context.addCookies([{
      name: 'jwt_token',
      value: 'dummy-token',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock login and auth/me
    await page.route('**/auth/login**', async (route) => {
      console.log(`[TEST MOCK] Intercepted login request: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-jwt-token',
          user: { id: 1, email: 'review@example.com', name: 'Review User', role: 'review', status: 'active' }
        }),
      });
    });

    await page.route('**/auth/me**', async (route) => {
      console.log(`[TEST MOCK] Intercepted me request: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, email: 'review@example.com', name: 'Review User', role: 'review', status: 'active' }
        }),
      });
    });

    // Mock dashboard data
    await page.route('**/leads/mine**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/reviews/mine**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/states**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // Go to login with redirect parameter
    console.log('[TEST] Navigating to login...');
    await page.goto('/login?redirect=/review-dashboard');
    
    console.log('[TEST] Filling login form...');
    await page.fill('input[name="email"]', 'review@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check if redirected to review-dashboard
    console.log('[TEST] Waiting for redirect to review-dashboard...');
    await expect(page).toHaveURL(/\/review-dashboard/, { timeout: 15000 });
    
    // Verifying dashboard content
    console.log('[TEST] Verifying dashboard content...');
    await expect(page.locator('h1')).toContainText('Meu Painel', { timeout: 15000 });
  });

  test('should redirect to login when 401 occurs on review-dashboard', async ({ page, context }) => {
    // Set a dummy cookie so middleware doesn't redirect
    await context.addCookies([{
      name: 'jwt_token',
      value: 'dummy-token',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock auth/me
    await page.route('**/auth/me**', async (route) => {
      console.log(`[TEST MOCK] Intercepted me request for 401 test: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, email: 'review@example.com', name: 'Review User', role: 'review', status: 'active' }
        }),
      });
    });

    // Mock APIs to return 401
    await page.route('**/reviews/mine**', async (route) => {
      console.log(`[TEST MOCK] Returning 401 for reviews/mine`);
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });
    await page.route('**/leads/mine**', async (route) => {
      console.log(`[TEST MOCK] Returning 401 for leads/mine`);
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });
    await page.route('**/states**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    console.log('[TEST] Navigating to review-dashboard...');
    await page.goto('/review-dashboard');

    // Should be redirected to login with error parameter
    console.log('[TEST] Waiting for redirect to login due to 401...');
    await expect(page).toHaveURL(/.*\/login\?.*error=session_expired.*/, { timeout: 15000 });
    await expect(page.locator('text=Sua sessao expirou')).toBeVisible();
  });

  test('should redirect to login when unauthorized role access review-dashboard', async ({ page, context }) => {
    // Set a dummy cookie so middleware doesn't redirect
    await context.addCookies([{
      name: 'jwt_token',
      value: 'dummy-token',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock auth/me with regular user role
    await page.route('**/auth/me**', async (route) => {
      console.log(`[TEST MOCK] Intercepted me request for unauthorized test: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, email: 'regular@example.com', name: 'Regular User', role: 'user', status: 'active' }
        }),
      });
    });
    
    await page.route('**/states**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    console.log('[TEST] Navigating to review-dashboard...');
    await page.goto('/review-dashboard');

    // Should be redirected to login with unauthorized error
    console.log('[TEST] Waiting for redirect to login due to unauthorized role...');
    await expect(page).toHaveURL(/.*error=unauthorized.*/, { timeout: 15000 });
    await expect(page.locator('text=Voce nao tem permissao')).toBeVisible();
  });
});
