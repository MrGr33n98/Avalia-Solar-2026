const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'https://www.avaliasolar.com.br';
const API_ORIGIN = process.env.TEST_API_ORIGIN || 'https://api.avaliasolar.com.br';
const TEST_TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 90000);
const TEST_HEADLESS = process.env.TEST_HEADLESS === 'true';
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test-artifacts', `comprehensive-final-${RUN_ID}`);

const SIDEBAR_EXPECTATIONS = [
  { key: 'home', pattern: /home/i },
  { key: 'analytics', pattern: /analytics/i },
  { key: 'reviews', pattern: /avaliacoes|avaliações/i },
  { key: 'interactions', pattern: /dados de interacao|dados de interação/i },
  { key: 'products', pattern: /edicao de produto|edição de produto|produto/i },
  { key: 'questions', pattern: /perguntas/i },
  { key: 'integrations', pattern: /integracoes|integrações/i },
  { key: 'badges', pattern: /selos/i },
];

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function sanitizeLabel(label) {
  return String(label || 'credential')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCredentials() {
  const fromJson = process.env.TEST_CREDENTIALS_JSON;
  if (fromJson) {
    const parsed = JSON.parse(fromJson);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('TEST_CREDENTIALS_JSON must be a non-empty array.');
    }
    return parsed
      .filter((item) => item && item.email && item.password)
      .map((item, idx) => ({
        label: item.label || `Credential-${idx + 1}`,
        email: item.email,
        password: item.password,
      }));
  }

  const fromEnv = [
    {
      label: 'Admin',
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_ADMIN_PASSWORD,
    },
    {
      label: 'Regular',
      email: process.env.TEST_REGULAR_EMAIL,
      password: process.env.TEST_REGULAR_PASSWORD,
    },
  ].filter((item) => item.email && item.password);

  if (fromEnv.length === 0) {
    throw new Error(
      'No credentials configured. Set TEST_CREDENTIALS_JSON or TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD.'
    );
  }

  return fromEnv;
}

function summarizeRequestFailures(failures) {
  const grouped = new Map();
  for (const failure of failures) {
    const key = `${failure.method} ${failure.url}`;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }
  return Array.from(grouped.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function summarizeApiResponses(responses) {
  const grouped = new Map();
  for (const item of responses) {
    const key = `${item.status} ${item.method} ${item.url}`;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }
  return Array.from(grouped.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
}

function getPathname(rawUrl) {
  try {
    return new URL(rawUrl).pathname.toLowerCase();
  } catch {
    return String(rawUrl || '').toLowerCase();
  }
}

function isReadyPostLoginPath(pathname) {
  if (!pathname) return false;
  return !pathname.startsWith('/login') && !pathname.startsWith('/register') && !pathname.startsWith('/select-company');
}

async function checkApiHealthAndCors() {
  const report = {
    checked_at: new Date().toISOString(),
    api_origin: API_ORIGIN,
    health: null,
    cors_preflight: null,
    errors: [],
  };

  try {
    const healthResponse = await fetch(`${API_ORIGIN}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    let body = null;
    try {
      body = await healthResponse.json();
    } catch {
      body = null;
    }
    report.health = {
      status: healthResponse.status,
      ok: healthResponse.ok,
      body,
    };
  } catch (error) {
    report.errors.push(`health_check_failed: ${String(error)}`);
  }

  try {
    const corsResponse = await fetch(`${API_ORIGIN}/api/v1/auth/me`, {
      method: 'OPTIONS',
      headers: {
        Origin: BASE_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    report.cors_preflight = {
      status: corsResponse.status,
      ok: corsResponse.ok,
      allow_origin: corsResponse.headers.get('access-control-allow-origin'),
      allow_methods: corsResponse.headers.get('access-control-allow-methods'),
      allow_credentials: corsResponse.headers.get('access-control-allow-credentials'),
    };
  } catch (error) {
    report.errors.push(`cors_preflight_failed: ${String(error)}`);
  }

  return report;
}

function attachPageInstrumentation(page, collector) {
  page.on('console', (message) => {
    collector.console.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
      timestamp: new Date().toISOString(),
    });
  });

  page.on('pageerror', (error) => {
    collector.pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  });

  page.on('requestfailed', (request) => {
    collector.requestFailed.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      failureText: request.failure()?.errorText || 'unknown',
      timestamp: new Date().toISOString(),
    });
  });

  page.on('response', (response) => {
    const url = response.url();
    if (!/\/api\/|api\.avaliasolar\.com\.br/i.test(url)) return;

    collector.apiResponses.push({
      method: response.request().method(),
      url,
      status: response.status(),
      ok: response.ok(),
      timestamp: new Date().toISOString(),
    });
  });
}

async function openLoginPage(page) {
  const loginLink = page.locator('a[href="/login"]').first();
  if (await loginLink.isVisible({ timeout: 7000 }).catch(() => false)) {
    await loginLink.click({ timeout: 10000 });
  } else {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT_MS });
  }

  await page.waitForURL(/\/login/i, { timeout: 15000 }).catch(() => {});
}

async function submitLogin(page, credential) {
  await page.fill('input[type="email"]', credential.email, { timeout: 10000 });
  await page.fill('input[type="password"]', credential.password, { timeout: 10000 });

  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click({ timeout: 10000 });

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function maybeCompleteSelectCompany(page, credentialArtifactsDir) {
  const selectionResult = {
    attempted: false,
    had_selectable_company: false,
    selected: false,
    initial_url: page.url(),
    final_url: page.url(),
  };

  const pathname = getPathname(page.url());
  if (!pathname.startsWith('/select-company')) {
    return selectionResult;
  }

  selectionResult.attempted = true;
  await page.screenshot({
    path: path.join(credentialArtifactsDir, 'select-company-before.png'),
    fullPage: true,
  }).catch(() => {});

  const selectButtons = page.getByRole('button', { name: /selecionar/i });
  const count = await selectButtons.count().catch(() => 0);
  selectionResult.had_selectable_company = count > 0;

  if (count > 0) {
    await selectButtons.first().click({ timeout: 15000 }).catch(() => {});
    await page
      .waitForURL((url) => {
        const nextPath = url.pathname.toLowerCase();
        return nextPath.startsWith('/company-dashboard') || nextPath.startsWith('/dashboard');
      }, { timeout: 25000 })
      .catch(() => {});

    selectionResult.selected = getPathname(page.url()) !== pathname;
  }

  await page.waitForTimeout(1500).catch(() => {});
  selectionResult.final_url = page.url();
  await page.screenshot({
    path: path.join(credentialArtifactsDir, 'select-company-after.png'),
    fullPage: true,
  }).catch(() => {});

  return selectionResult;
}

async function collectSessionCheck(page) {
  return await page.evaluate(async () => {
    const checks = [];

    const runCheck = async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        let body = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        const result = {
          endpoint,
          status: response.status,
          ok: response.ok,
          has_user: Boolean(body && (body.user || body.id || body.email)),
          body_preview: body ? JSON.stringify(body).slice(0, 300) : null,
        };

        checks.push(result);
        return result;
      } catch (error) {
        const result = {
          endpoint,
          error: String(error),
          ok: false,
          has_user: false,
        };
        checks.push(result);
        return result;
      }
    };

    // Primary endpoint first.
    const primary = await runCheck('/api/v1/auth/me');

    // Fallback endpoint only if primary did not return a valid user.
    if (!primary.ok || !primary.has_user) {
      await runCheck('/api/v1/users/me');
    }

    return checks;
  });
}

async function collectAuthCookies(context) {
  const targets = [BASE_URL, API_ORIGIN];
  const cookies = await context.cookies(targets);
  const authCookies = cookies.filter((cookie) =>
    /jwt_token|refresh_token|auth_token|session/i.test(cookie.name)
  );

  return {
    totalCookies: cookies.length,
    authCookieNames: authCookies.map((cookie) => cookie.name),
    hasAuthCookie: authCookies.length > 0,
  };
}

async function validateSidebar(page) {
  const results = [];
  for (const item of SIDEBAR_EXPECTATIONS) {
    const byTestId = page
      .locator(`[data-testid="sidebar-item-${item.key}"], [data-qa="sidebar-item-${item.key}"]`)
      .first();
    const byRole = page.getByRole('link', { name: item.pattern }).first();
    const byText = page.locator('nav').getByText(item.pattern).first();

    const visible =
      (await byTestId.isVisible().catch(() => false)) ||
      (await byRole.isVisible().catch(() => false)) ||
      (await byText.isVisible().catch(() => false));

    results.push({ key: item.key, visible });
  }

  const found = results.filter((item) => item.visible).length;
  return { found, total: SIDEBAR_EXPECTATIONS.length, items: results };
}

async function runCredentialFlow(browser, credential, baseArtifactsDir) {
  const slug = sanitizeLabel(credential.label);
  const credentialArtifactsDir = path.join(baseArtifactsDir, slug);
  ensureDir(credentialArtifactsDir);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'pt-BR',
  });
  const page = await context.newPage();

  const collector = {
    console: [],
    pageErrors: [],
    requestFailed: [],
    apiResponses: [],
  };
  attachPageInstrumentation(page, collector);

  const result = {
    credential: {
      label: credential.label,
      email: credential.email,
    },
    login: {
      success: false,
      ready_for_dashboard: false,
      post_login_url: null,
      final_url: null,
      reason: null,
    },
    company_selection: null,
    session_checks: [],
    auth_cookies: null,
    dashboard_check: null,
    sidebar_check: null,
    pages: [],
    network: collector,
    artifacts_dir: credentialArtifactsDir,
  };

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT_MS });
    await page.screenshot({ path: path.join(credentialArtifactsDir, 'homepage.png'), fullPage: true });
    result.pages.push({ name: 'homepage', url: page.url() });

    await openLoginPage(page);
    await page.screenshot({ path: path.join(credentialArtifactsDir, 'login.png'), fullPage: true });
    result.pages.push({ name: 'login', url: page.url() });

    await submitLogin(page, credential);
    result.login.post_login_url = page.url();
    await page.screenshot({ path: path.join(credentialArtifactsDir, 'post-login.png'), fullPage: true });

    result.company_selection = await maybeCompleteSelectCompany(page, credentialArtifactsDir);
    result.login.final_url = page.url();

    result.session_checks = await collectSessionCheck(page);
    result.auth_cookies = await collectAuthCookies(context);

    const hasValidSession = result.session_checks.some(
      (item) => item.ok === true && item.has_user === true
    );
    const finalPathname = getPathname(result.login.final_url || result.login.post_login_url);
    const notOnLogin = !finalPathname.startsWith('/login');
    const readyForDashboard = isReadyPostLoginPath(finalPathname);
    result.login.ready_for_dashboard = readyForDashboard;

    result.login.success = notOnLogin && (hasValidSession || result.auth_cookies.hasAuthCookie);
    if (!notOnLogin) {
      result.login.reason = 'still_on_login';
    } else if (!hasValidSession && !result.auth_cookies.hasAuthCookie) {
      result.login.reason = 'no_valid_session_evidence';
    } else if (!readyForDashboard) {
      result.login.reason = `post_login_not_ready:${finalPathname || 'unknown'}`;
    }

    if (result.login.success && result.login.ready_for_dashboard) {
      await page.goto(`${BASE_URL}/dashboard/company`, {
        waitUntil: 'domcontentloaded',
        timeout: TEST_TIMEOUT_MS,
      });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(credentialArtifactsDir, 'dashboard-company.png'), fullPage: true });
      result.dashboard_check = { url: page.url() };
      result.sidebar_check = await validateSidebar(page);
      result.pages.push({ name: 'dashboard-company', url: page.url() });

      await page.goto(`${BASE_URL}/companies`, {
        waitUntil: 'domcontentloaded',
        timeout: TEST_TIMEOUT_MS,
      });
      await page.screenshot({ path: path.join(credentialArtifactsDir, 'companies.png'), fullPage: true });
      result.pages.push({ name: 'companies', url: page.url() });

      await page.goto(`${BASE_URL}/companies/genial-solar`, {
        waitUntil: 'domcontentloaded',
        timeout: TEST_TIMEOUT_MS,
      });
      await page.screenshot({ path: path.join(credentialArtifactsDir, 'company-detail.png'), fullPage: true });
      result.pages.push({ name: 'company-detail', url: page.url() });
    }
  } catch (error) {
    result.login.reason = `flow_exception: ${String(error)}`;
    await page
      .screenshot({ path: path.join(credentialArtifactsDir, 'flow-error.png'), fullPage: true })
      .catch(() => {});
  } finally {
    writeJson(path.join(credentialArtifactsDir, 'network.json'), {
      request_failed_summary: summarizeRequestFailures(collector.requestFailed),
      api_responses_summary: summarizeApiResponses(collector.apiResponses),
      raw: collector,
    });
    await context.close();
  }

  return result;
}

function buildTextReport(report) {
  const lines = [];
  lines.push('AVALIA SOLAR - COMPREHENSIVE FINAL REPORT');
  lines.push(`Generated At: ${report.generated_at}`);
  lines.push(`Base URL: ${report.base_url}`);
  lines.push(`API Origin: ${report.api_origin}`);
  lines.push(`Artifacts Dir: ${report.artifacts_dir}`);
  lines.push('');

  lines.push('PRE-CHECKS');
  lines.push(`Health: ${report.api_precheck.health ? JSON.stringify(report.api_precheck.health) : 'unavailable'}`);
  lines.push(
    `CORS Preflight: ${
      report.api_precheck.cors_preflight ? JSON.stringify(report.api_precheck.cors_preflight) : 'unavailable'
    }`
  );
  if (report.api_precheck.errors.length > 0) {
    lines.push(`Pre-check errors: ${report.api_precheck.errors.join(' | ')}`);
  }
  lines.push('');

  for (const credentialResult of report.credentials) {
    lines.push(`CREDENTIAL: ${credentialResult.credential.label} (${credentialResult.credential.email})`);
    lines.push(`Login success: ${credentialResult.login.success}`);
    lines.push(`Ready for dashboard: ${credentialResult.login.ready_for_dashboard}`);
    lines.push(`Post-login URL: ${credentialResult.login.post_login_url || 'n/a'}`);
    lines.push(`Final URL: ${credentialResult.login.final_url || 'n/a'}`);
    lines.push(`Login reason: ${credentialResult.login.reason || 'n/a'}`);
    lines.push(`Company selection: ${JSON.stringify(credentialResult.company_selection)}`);
    lines.push(`Auth cookies: ${JSON.stringify(credentialResult.auth_cookies)}`);
    lines.push(`Session checks: ${JSON.stringify(credentialResult.session_checks)}`);
    lines.push(`Dashboard URL: ${credentialResult.dashboard_check?.url || 'n/a'}`);
    lines.push(
      `Sidebar: ${
        credentialResult.sidebar_check
          ? `${credentialResult.sidebar_check.found}/${credentialResult.sidebar_check.total}`
          : 'not validated'
      }`
    );

    const failedRequests = summarizeRequestFailures(credentialResult.network.requestFailed).slice(0, 8);
    if (failedRequests.length > 0) {
      lines.push('Top failed requests:');
      failedRequests.forEach((item) => lines.push(`- ${item.count}x ${item.key}`));
    } else {
      lines.push('Top failed requests: none');
    }

    const apiErrors = credentialResult.network.apiResponses.filter((item) => item.status >= 400);
    lines.push(`API responses >= 400: ${apiErrors.length}`);
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  ensureDir(ARTIFACTS_DIR);

  const credentials = parseCredentials();
  const apiPrecheck = await checkApiHealthAndCors();

  console.log('Running comprehensive final test with isolated browser contexts...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Artifacts: ${ARTIFACTS_DIR}`);
  console.log(`Credentials: ${credentials.map((c) => `${c.label}:${c.email}`).join(', ')}`);

  const browser = await chromium.launch({
    headless: TEST_HEADLESS,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const credentialResults = [];
  try {
    for (const credential of credentials) {
      console.log(`\n--- Credential flow: ${credential.label} (${credential.email})`);
      const result = await runCredentialFlow(browser, credential, ARTIFACTS_DIR);
      credentialResults.push(result);
      console.log(
        `Login=${result.login.success} | URL=${result.login.post_login_url || 'n/a'} | FailedRequests=${result.network.requestFailed.length}`
      );
    }
  } finally {
    await browser.close();
  }

  const report = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    api_origin: API_ORIGIN,
    artifacts_dir: ARTIFACTS_DIR,
    api_precheck: apiPrecheck,
    credentials: credentialResults,
  };

  writeJson(path.join(ARTIFACTS_DIR, 'report.json'), report);
  writeText(path.join(process.cwd(), 'COMPREHENSIVE_TEST_FINAL_REPORT.txt'), buildTextReport(report));

  const successful = credentialResults.some((item) => item.login.success);
  console.log(`\nFinal status: ${successful ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Report JSON: ${path.join(ARTIFACTS_DIR, 'report.json')}`);
  console.log('Text report overwritten: COMPREHENSIVE_TEST_FINAL_REPORT.txt');
  process.exit(successful ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal execution error:', error);
  process.exit(1);
});
