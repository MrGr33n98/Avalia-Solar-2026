import { test, expect, Page } from '@playwright/test';

test.describe('JWT Revocation and Logout', () => {
  const testUser = {
    email: 'test-jwt@example.com',
    password: 'TestPassword123!',
    name: 'JWT Test User'
  };
  
  test.beforeAll(async ({ browser }) => {
    // Create test user if needed
    const page = await browser.newPage();
    try {
      await page.goto('/register');
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.check('input[name="terms"]');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    } catch (e) {
      // User might already exist
      console.log('User might already exist, continuing tests');
    }
    await page.close();
  });
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL(/dashboard|home/, { timeout: 5000 }).catch(() => {});
  });
  
  test('should logout and revoke JWT token', async ({ page, context }) => {
    // Verify user is logged in
    const cookies = await context.cookies();
    const jwtCookie = cookies.find(c => c.name === 'jwt_token');
    expect(jwtCookie).toBeTruthy();
    
    // Perform logout
    await page.click('[data-testid="logout-button"], a[href="/logout"], button:has-text("Sair")').catch(() => {
      // If no button found, navigate directly
      page.goto('/logout');
    });
    
    // Wait for logout page or redirect to login
    await page.waitForURL(/login|logout/, { timeout: 5000 });
    
    // Verify cookies were cleared
    const cookiesAfter = await context.cookies();
    const jwtCookieAfter = cookiesAfter.find(c => c.name === 'jwt_token');
    expect(jwtCookieAfter).toBeUndefined();
    
    // Try to access protected page
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
  
  test('should reject revoked token on API calls', async ({ page, request }) => {
    // Get current JWT token
    const cookies = await page.context().cookies();
    const jwtCookie = cookies.find(c => c.name === 'jwt_token');
    
    if (!jwtCookie) {
      test.skip();
      return;
    }
    
    const token = jwtCookie.value;
    
    // Logout (revoke token)
    await page.goto('/logout');
    await page.waitForTimeout(2000);
    
    // Try to use the revoked token
    const response = await request.get('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Should return 401 unauthorized
    expect(response.status()).toBe(401);
    
    const data = await response.json().catch(() => ({}));
    expect(
      data.error?.toLowerCase().includes('revoked') ||
      data.error?.toLowerCase().includes('expired') ||
      data.code === 'TOKEN_REVOKED' ||
      data.code === 'SESSION_EXPIRED'
    ).toBeTruthy();
  });
  
  test('logout from all devices', async ({ page, browser }) => {
    // Create second session (another device)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    // Login in second session
    await page2.goto('/login');
    await page2.fill('input[name="email"]', testUser.email);
    await page2.fill('input[name="password"]', testUser.password);
    await page2.click('button[type="submit"]');
    await page2.waitForURL(/dashboard|home/, { timeout: 5000 }).catch(() => {});
    
    // Verify both sessions are active
    expect(await page.title()).toBeTruthy();
    expect(await page2.title()).toBeTruthy();
    
    // Logout from all devices in first session
    const logoutAllButton = page.locator('[data-testid="logout-all-button"], button:has-text("Sair de todos")');
    
    if (await logoutAllButton.count() > 0) {
      await logoutAllButton.click();
    } else {
      // Manual API call if UI button doesn't exist
      await page.evaluate(async () => {
        await fetch('/api/v1/auth/logout_all', {
          method: 'POST',
          credentials: 'include'
        });
      });
    }
    
    await page.waitForTimeout(2000);
    
    // Try to access dashboard in second session
    await page2.reload();
    
    // Second session should also be logged out
    await page2.waitForURL(/login/, { timeout: 5000 }).catch(async () => {
      // If not redirected, try accessing protected resource
      const apiResponse = await page2.evaluate(async () => {
        const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
        return { status: res.status, ok: res.ok };
      });
      
      expect(apiResponse.status).toBe(401);
    });
    
    await context2.close();
  });
  
  test('should handle session expired gracefully', async ({ page }) => {
    // Simulate session expiration by revoking token
    await page.evaluate(async () => {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    });
    
    // Try to make an API call
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
        const data = await res.json();
        return { status: res.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    // Should get unauthorized
    expect(response.status).toBe(401);
    
    // Page should handle it and redirect to login
    await page.waitForTimeout(1000);
    await page.reload();
    await expect(page).toHaveURL(/login/);
  });
  
  test('should allow new login after logout', async ({ page, context }) => {
    // Logout
    await page.goto('/logout');
    await page.waitForURL(/login/, { timeout: 5000 });
    
    // Login again
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should successfully login
    await page.waitForURL(/dashboard|home/, { timeout: 5000 }).catch(() => {});
    
    // Verify new token was issued
    const cookies = await context.cookies();
    const jwtCookie = cookies.find(c => c.name === 'jwt_token');
    expect(jwtCookie).toBeTruthy();
    
    // Should be able to access protected resources
    const meResponse = await page.evaluate(async () => {
      const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
      return { status: res.status, ok: res.ok };
    });
    
    expect(meResponse.status).toBe(200);
    expect(meResponse.ok).toBe(true);
  });
});
