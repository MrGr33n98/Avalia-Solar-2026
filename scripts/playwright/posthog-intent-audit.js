#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const TARGET_URL = process.env.TARGET_URL || 'https://www.avaliasolar.com.br';
const HEADLESS = process.env.HEADLESS
  ? process.env.HEADLESS !== 'false'
  : process.platform === 'darwin'
    ? false
    : true;
const SLOW_MO = Number(process.env.SLOW_MO || 0);
const PLAYWRIGHT_CHANNEL = process.env.PLAYWRIGHT_CHANNEL || '';
const OUTPUT_PATH =
  process.env.OUTPUT_PATH ||
  path.join(process.cwd(), 'test-results', 'posthog-intent-audit.json');
const LOGIN_EMAIL = process.env.LOGIN_EMAIL || '';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

const requiredEvents = ['page_view', 'category_selected'];

const report = {
  started_at: new Date().toISOString(),
  target_url: TARGET_URL,
  headless: HEADLESS,
  playwright: {
    browser: 'chromium',
  },
  findings: [],
  scenarios: [],
  browser_captures: [],
  backend_requests: [],
  backend_responses: [],
  posthog_requests: [],
  posthog_responses: [],
  errors: [],
  summary: {},
};

function resolveExecutablePath() {
  const explicitPath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  if (explicitPath && fs.existsSync(explicitPath)) return explicitPath;

  const candidatePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    path.join(
      process.env.HOME || '',
      'Library/Caches/ms-playwright/chromium-1208/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    ),
    path.join(
      process.env.HOME || '',
      'Library/Caches/ms-playwright/chromium-1212/chrome-linux/chrome'
    ),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  return candidatePaths.find((candidate) => fs.existsSync(candidate)) || null;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function safeJsonParse(payload) {
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch (_error) {
    return null;
  }
}

function isBackendTrackRequest(url) {
  return url.includes('/api/v1/analytics/track');
}

function isPostHogRequest(url) {
  return (
    url.includes('/ingest/') ||
    url.includes('us.i.posthog.com') ||
    url.includes('app.posthog.com') ||
    url.includes(new URL(POSTHOG_HOST).host)
  );
}

async function installClientAuditHooks(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'avaliasolar_consent',
      JSON.stringify({
        analytics: true,
        marketing: true,
        lastUpdated: Date.now(),
      })
    );

    sessionStorage.setItem(
      'avaliasolar_session',
      JSON.stringify({
        id: 'sess_playwright_posthog_audit',
        startTime: Date.now(),
        lastActivity: Date.now(),
      })
    );

    window.__phAudit = {
      captures: [],
      identify: [],
      alias: [],
      pageviews: [],
      errors: [],
    };

    const installPosthogSpy = () => {
      try {
        if (!window.posthog || window.__phAuditInstalled) return;
        window.__phAuditInstalled = true;

        const originalCapture = window.posthog.capture?.bind(window.posthog);
        const originalIdentify = window.posthog.identify?.bind(window.posthog);
        const originalAlias = window.posthog.alias?.bind(window.posthog);

        if (originalCapture) {
          window.posthog.capture = function patchedCapture(eventName, properties, options) {
            window.__phAudit.captures.push({
              event: eventName,
              properties: properties || {},
              options: options || {},
              captured_at: new Date().toISOString(),
            });
            return originalCapture(eventName, properties, options);
          };
        }

        if (originalIdentify) {
          window.posthog.identify = function patchedIdentify(distinctId, properties, options) {
            window.__phAudit.identify.push({
              distinct_id: distinctId,
              properties: properties || {},
              options: options || {},
              captured_at: new Date().toISOString(),
            });
            return originalIdentify(distinctId, properties, options);
          };
        }

        if (originalAlias) {
          window.posthog.alias = function patchedAlias(alias) {
            window.__phAudit.alias.push({
              alias,
              captured_at: new Date().toISOString(),
            });
            return originalAlias(alias);
          };
        }
      } catch (error) {
        window.__phAudit.errors.push(String(error));
      }
    };

    const interval = window.setInterval(() => {
      installPosthogSpy();
      if (window.__phAuditInstalled) {
        window.clearInterval(interval);
      }
    }, 250);
  });
}

async function waitForSettled(page, timeout = 2500) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(timeout);
}

async function scenarioHome(page) {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  await waitForSettled(page);

  report.scenarios.push({
    name: 'home',
    url: page.url(),
    title: await page.title(),
  });
}

async function scenarioCategory(page) {
  await page.goto(`${TARGET_URL}/categories/energia-solar`, { waitUntil: 'domcontentloaded' });
  await waitForSettled(page);

  const title = await page.title();
  const visibleError = await page.locator('text=Erro ao Carregar Categorias').isVisible().catch(() => false);
  if (visibleError) {
    report.errors.push('Category page rendered error state');
  }

  report.scenarios.push({
    name: 'category',
    url: page.url(),
    title,
    visible_error: visibleError,
  });

  const companyLink = page
    .locator('a[href*="/companies/"]')
    .filter({ hasNot: page.locator('a[href*="/categories/"]') })
    .first();

  if ((await companyLink.count()) > 0) {
    await companyLink.click();
    await waitForSettled(page);
    report.scenarios.push({
      name: 'company_profile',
      url: page.url(),
      title: await page.title(),
    });
  } else {
    report.findings.push('No company link found on category page; company_card_click could not be validated.');
  }
}

async function scenarioLoginDashboard(page) {
  if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
    report.findings.push('Login scenario skipped: LOGIN_EMAIL/LOGIN_PASSWORD not provided.');
    return;
  }

  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await waitForSettled(page, 1500);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await emailInput.fill(LOGIN_EMAIL);
  await passwordInput.fill(LOGIN_PASSWORD);
  await submitButton.click();
  await page.waitForTimeout(4000);

  report.scenarios.push({
    name: 'login',
    url: page.url(),
    title: await page.title(),
  });

  if (page.url().includes('/dashboard')) {
    await page.goto(`${TARGET_URL}/dashboard/company`, { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    report.scenarios.push({
      name: 'dashboard_company',
      url: page.url(),
      title: await page.title(),
    });
  } else {
    report.findings.push('Login did not redirect to dashboard; dashboard_viewed could not be validated.');
  }
}

function summarize() {
  const capturedEvents = report.browser_captures.map((entry) => entry.event);
  const backendEvents = report.backend_requests
    .map((entry) => entry.body?.event_type)
    .filter(Boolean);

  const missingRequiredEvents = requiredEvents.filter(
    (eventName) =>
      !capturedEvents.includes(eventName) && !backendEvents.includes(eventName)
  );

  const backendWithoutSession = report.backend_requests.filter(
    (entry) => !entry.body?.metadata?.session_id
  );

  report.summary = {
    browser_capture_count: report.browser_captures.length,
    backend_request_count: report.backend_requests.length,
    posthog_request_count: report.posthog_requests.length,
    missing_required_events: missingRequiredEvents,
    backend_requests_without_session_id: backendWithoutSession.length,
    distinct_browser_events: [...new Set(capturedEvents)].sort(),
    distinct_backend_events: [...new Set(backendEvents)].sort(),
    verdict:
      missingRequiredEvents.length === 0 &&
      report.posthog_requests.length > 0 &&
      backendWithoutSession.length === 0
        ? 'pass'
        : 'warn',
  };

  if (report.posthog_requests.length === 0) {
    report.findings.push(
      'No PostHog network request observed. This can mean missing consent, missing PostHog key, ad-blocking, or proxy misconfiguration.'
    );
  }

  if (backendWithoutSession.length > 0) {
    report.findings.push('Some backend analytics requests were sent without metadata.session_id.');
  }

  if (missingRequiredEvents.length > 0) {
    report.findings.push(
      `Required intent events missing from observed traffic: ${missingRequiredEvents.join(', ')}`
    );
  }
}

async function main() {
  ensureDir(OUTPUT_PATH);

  const executablePath = resolveExecutablePath();
  let browser;

  try {
    browser = await chromium.launch({
      headless: HEADLESS,
      slowMo: SLOW_MO,
      executablePath: executablePath || undefined,
      channel: PLAYWRIGHT_CHANNEL || undefined,
    });
  } catch (error) {
    const launchHint = [
      `Failed to launch browser: ${error.message}`,
      `Resolved executable: ${executablePath || 'playwright-default'}`,
      `Channel: ${PLAYWRIGHT_CHANNEL || 'none'}`,
      'Try one of:',
      '- PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chrome',
      '- PLAYWRIGHT_CHANNEL=chrome',
      '- On the VM, install a supported Chrome/Chromium package',
      '- On older macOS hosts, prefer a system Chrome instead of Playwright downloaded Chromium',
    ].join('\n');
    throw new Error(launchHint);
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      report.errors.push(`console:${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    report.errors.push(`pageerror:${error.message}`);
  });

  page.on('request', (request) => {
    const url = request.url();

    if (isBackendTrackRequest(url)) {
      const payload = safeJsonParse(request.postData());
      report.backend_requests.push({
        url,
        method: request.method(),
        body: payload,
      });
      return;
    }

    if (isPostHogRequest(url)) {
      report.posthog_requests.push({
        url,
        method: request.method(),
        post_data: request.postData() || null,
      });
    }
  });

  page.on('response', async (response) => {
    const url = response.url();

    if (isBackendTrackRequest(url)) {
      let body = null;
      try {
        body = await response.json();
      } catch (_error) {
        body = null;
      }

      report.backend_responses.push({
        url,
        status: response.status(),
        body,
      });
      return;
    }

    if (isPostHogRequest(url)) {
      report.posthog_responses.push({
        url,
        status: response.status(),
      });
    }
  });

  await installClientAuditHooks(page);

  try {
    await scenarioHome(page);
    await scenarioCategory(page);
    await scenarioLoginDashboard(page);

    await page.waitForTimeout(3000);
    const audit = await page.evaluate(() => window.__phAudit || null);
    report.browser_captures = audit?.captures || [];
    report.browser_identify = audit?.identify || [];
    report.browser_alias = audit?.alias || [];
    if (Array.isArray(audit?.errors) && audit.errors.length > 0) {
      report.errors.push(...audit.errors.map((entry) => `audit:${entry}`));
    }
  } catch (error) {
    report.errors.push(`runtime:${error.message}`);
  } finally {
    await browser.close();
  }

  summarize();
  report.finished_at = new Date().toISOString();

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

  console.log('');
  console.log('PostHog Intent Audit');
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Report: ${OUTPUT_PATH}`);
  console.log(`Verdict: ${report.summary.verdict}`);
  console.log(`Executable: ${executablePath || 'playwright-default'}`);
  console.log(`Browser captures: ${report.summary.browser_capture_count}`);
  console.log(`Backend requests: ${report.summary.backend_request_count}`);
  console.log(`PostHog requests: ${report.summary.posthog_request_count}`);
  if (report.summary.missing_required_events.length > 0) {
    console.log(`Missing required events: ${report.summary.missing_required_events.join(', ')}`);
  }
  if (report.findings.length > 0) {
    console.log('Findings:');
    report.findings.forEach((finding) => console.log(`- ${finding}`));
  }
  if (report.errors.length > 0) {
    console.log('Errors:');
    report.errors.forEach((error) => console.log(`- ${error}`));
  }

  process.exit(report.summary.verdict === 'pass' ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
