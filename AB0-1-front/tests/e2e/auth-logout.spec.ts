import { test, expect } from '@playwright/test';

test.describe('JWT Revocation and Logout', () => {
  // Os testes compartilham o usuário E2E e um deles chama POST /api/v1/auth/logout_all
  // (que revoga globalmente todos os JWTs do usuário). Executar em série evita
  // interferência cruzada sem enfraquecer a revogação JWT.
  test.describe.configure({ mode: 'serial' });

  const loginForm = (page: import('@playwright/test').Page) =>
    page.locator('form').filter({ has: page.locator('#email') });

  const testUser = {
    email: process.env.E2E_USER_EMAIL || 'test@avaliasolar.com.br',
    password: process.env.E2E_USER_PASSWORD || 'Password123',
  };

  let issuedToken: string;

  test.beforeEach(async ({ page }) => {
    const response = await page.request.post('/api/v1/auth/login', {
      data: testUser,
    });
    expect(response.ok(), `Auth fixture login HTTP ${response.status()}`).toBe(true);

    const { token } = await response.json();
    expect(token).toBeTruthy();
    issuedToken = token;
    const currentUser = await page.request.get('/api/v1/auth/me');
    expect(currentUser.ok(), `Auth fixture /auth/me HTTP ${currentUser.status()}`).toBe(true);
    await page.goto('/');
  });

  test('should logout and revoke JWT token', async ({ page, context }) => {
    // Verify user is logged in
    const cookies = await context.cookies();
    const jwtCookie = cookies.find((c) => c.name === 'jwt_token');
    expect(jwtCookie).toBeTruthy();

    // The logout route revokes the active token and clears its browser cookie.
    await page.goto('/logout', { waitUntil: 'domcontentloaded' });

    // Wait for the logout request and its redirect before checking the cookie.
    await page.waitForURL(/\/login\?logout=success/, { timeout: 10000 });

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

    expect(jwtCookie).toBeTruthy();

    // Rails signs the browser cookie; use the actual JWT issued by the login API.
    const token = issuedToken;
    // A separate request context must accept the raw bearer before logout.
    const beforeLogout = await request.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(beforeLogout.status(), 'Bearer must be valid before revocation').toBe(200);

    // Logout (revoke token)
    await page.goto('/logout');
    await page.waitForURL(/\/login\?logout=success/, { timeout: 10000 });

    // Try to use the revoked token
    const response = await request.get('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Require explicit revocation, not merely an invalid or missing token.
    expect(response.status()).toBe(401);
    expect((await response.json()).code).toBe('TOKEN_REVOKED');
  });

  test('logout from all devices', async ({ page, browser }) => {
    // Create second session (another device)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Login in second session
    const secondLogin = await page2.request.post('/api/v1/auth/login', {
      data: testUser,
    });
    expect(secondLogin.ok()).toBeTruthy();
    const { token } = await secondLogin.json();
    expect(token).toBeTruthy();
    await page2.goto('/');

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
    await page.goto('/review-dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should allow new login after logout', async ({ page, context }) => {
    // Logout
    await page.goto('/logout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/login\?logout=success/, { timeout: 10000 });
    await expect
      .poll(async () =>
        (await page.context().cookies()).some((cookie) => cookie.name === 'jwt_token')
      )
      .toBe(false);

    // Confirm the login form issues a fresh session after logout.
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const expectedOrigin = new URL(page.url()).origin;
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    const loginResponsePromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/auth/login' &&
        response.request().method() === 'POST'
    );
    await loginForm(page).locator('button[type="submit"]').click();
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok(), `Relogin HTTP ${loginResponse.status()}`).toBe(true);
    const { token: newToken } = await loginResponse.json();
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(issuedToken);

    // Verify new token was issued
    await expect
      .poll(async () => (await context.cookies()).some((cookie) => cookie.name === 'jwt_token'))
      .toBe(true);

    // Wait for post-login navigation to settle on the same origin (never bouncing to production)
    await page.waitForURL((url) => url.origin === expectedOrigin && !url.pathname.startsWith('/login'), {
      timeout: 15000,
    });
    expect(new URL(page.url()).origin).toBe(expectedOrigin);

    // Should be able to access protected resources
    const currentUser = await page.request.get('/api/v1/auth/me');
    expect(currentUser.status(), 'Fresh browser session must authenticate on the real API').toBe(200);
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(async () => {
            const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
            return res.status;
          });
        } catch {
          return 0;
        }
      }, { timeout: 15000 })
      .toBe(200);
  });
});
