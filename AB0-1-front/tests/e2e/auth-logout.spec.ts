import { test, expect } from '@playwright/test';

test.describe('JWT Revocation and Logout', () => {
  const loginForm = (page: import('@playwright/test').Page) =>
    page.locator('form').filter({ has: page.locator('#email') });

  const testUser = {
    email: process.env.E2E_USER_EMAIL || 'test@avaliasolar.com.br',
    password: process.env.E2E_USER_PASSWORD || 'Password123',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await loginForm(page).locator('button[type="submit"]').click();
    await page.waitForURL(/review-dashboard|dashboard|home/, { timeout: 10000 });
    await expect
      .poll(async () =>
        (await page.context().cookies()).some((cookie) => cookie.name === 'jwt_token')
      )
      .toBe(true);
  });

  test('should logout and revoke JWT token', async ({ page, context }) => {
    // Verify user is logged in
    const cookies = await context.cookies();
    const jwtCookie = cookies.find((c) => c.name === 'jwt_token');
    expect(jwtCookie).toBeTruthy();

    // Perform logout
    await page
      .click('[data-testid="logout-button"], a[href="/logout"], button:has-text("Sair")')
      .catch(async () => page.goto('/logout'));

    // Wait for logout page or redirect to login
    await page.waitForURL(/login|logout/, { timeout: 5000 });

    // Verify cookies were cleared
    const cookiesAfter = await context.cookies();
    const jwtCookieAfter = cookiesAfter.find((c) => c.name === 'jwt_token');
    expect(jwtCookieAfter).toBeUndefined();

    // Try to access protected page
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should reject revoked token on API calls', async ({ page, request }) => {
    // Get current JWT token
    const cookies = await page.context().cookies();
    const jwtCookie = cookies.find((c) => c.name === 'jwt_token');

    if (!jwtCookie) {
      test.skip();
      return;
    }

    const token = jwtCookie.value;

    // Logout (revoke token)
    await page.goto('/logout');

    // Try to use the revoked token
    const response = await request.get('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
    await page2.goto('/login', { waitUntil: 'domcontentloaded' });
    await page2.locator('#email').fill(testUser.email);
    await page2.locator('#password').fill(testUser.password);
    await loginForm(page2).locator('button[type="submit"]').click();
    await page2.waitForURL(/review-dashboard|dashboard|home/, { timeout: 10000 });

    // Verify both sessions are active
    expect(await page.title()).toBeTruthy();
    expect(await page2.title()).toBeTruthy();

    // Logout from all devices in first session
    const logoutAllButton = page.locator(
      '[data-testid="logout-all-button"], button:has-text("Sair de todos")'
    );

    if ((await logoutAllButton.count()) > 0) {
      await logoutAllButton.click();
    } else {
      // Manual API call if UI button doesn't exist
      await page.evaluate(async () => {
        await fetch('/api/v1/auth/logout_all', {
          method: 'POST',
          credentials: 'include',
        });
      });
    }

    // Try to access dashboard in second session
    await page2.reload();

    // The second session must be revoked in the API even if its page was already open.
    await expect
      .poll(async () =>
        page2.evaluate(async () => {
          const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
          return res.status;
        })
      )
      .toBe(401);

    await context2.close();
  });

  test('should handle session expired gracefully', async ({ page }) => {
    // Simulate session expiration by revoking token
    await page.evaluate(async () => {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
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
    await page.reload();
    await expect(page).toHaveURL(/login/);
  });

  test('should allow new login after logout', async ({ page, context }) => {
    // Logout
    await page.goto('/logout');
    await page.waitForURL(/login/, { timeout: 5000 });

    // Login again
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await loginForm(page).locator('button[type="submit"]').click();

    // Should successfully login
    await page.waitForURL(/review-dashboard|dashboard|home/, { timeout: 10000 });

    // Verify new token was issued
    const cookies = await context.cookies();
    const jwtCookie = cookies.find((c) => c.name === 'jwt_token');
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
