// Spec 022-P / A1 — laboratório descartável (NÃO é código de produto).
// Build de produção local + Playwright; TODO tráfego fora de 127.0.0.1 é bloqueado ou mockado.
// Fixtures 100% sintéticas (tenants FIXTURE A/B 9001/9002). Sem cookies reais, sem backend.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { chromium } = require('@playwright/test');

const BASE = process.env.LAB_BASE || 'http://127.0.0.1:3100';
const OUT = process.env.LAB_OUT;
const SCENARIO = process.argv[2] || 'discover';
const RUNS = Number(process.argv[3] || 5);
const DELAY_MS = Number(process.env.LAB_API_DELAY_MS || 120);

const iso = (d = 0) => new Date(Date.UTC(2026, 10, 20 - d)).toISOString();
const company = (id, name) => ({
  id, name, slug: `fixture-${id}`, city: 'Florianópolis', state: 'SC', status: 'active', logo_url: null,
  plan: 'pro', role: 'owner', membership_role: 'owner', verified: true, rating_average: null, reviews_count: 0,
});
const A = company(9001, 'FIXTURE Solar A');
const B = company(9002, 'FIXTURE Solar B');
const FEATURE_KEYS = ['advanced_analytics', 'ai_live_inbox', 'company_ai_assistant', 'downloadable_materials',
  'leads_marketplace', 'media_gallery', 'notifications', 'promo_banner', 'sponsored_description', 'webhooks', 'intent_scores'];

function fixtureFor(url, method) {
  const p = url.pathname.replace(/^.*\/api\/v1/, '');
  if (p === '/auth/me') return { user: { id: 1, name: 'FIXTURE Owner', email: 'owner@fixture.invalid', role: 'company', company_id: 9001, status: 'active', approved_by_admin: true } };
  if (p === '/companies/mine' || p === '/users/me_companies') return [A, B];
  let m = p.match(/^\/companies\/(\d+)\/feature_access$/);
  if (m) return { plan: 'pro', subscription: { status: 'active' }, features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, { state: 'enabled' }])) };
  m = p.match(/^\/companies\/(\d+)$/);
  if (m) return Number(m[1]) === 9002 ? B : A;
  if (p.includes('timeseries')) return { series: Array.from({ length: 60 }, (_, i) => ({ date: iso(i).slice(0, 10), views: 10 + (i % 7), clicks: i % 5, leads: i % 3 })) };
  if (p.includes('/leads')) return [];
  if (p.includes('notifications')) return { notifications: [] };
  if (p.includes('top_campaigns')) return { campaigns: [] };
  if (method !== 'GET') return { ok: true };
  return {};
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const results = [];
  for (let i = 0; i < (SCENARIO === 'discover' ? 1 : RUNS); i++) {
    const mobile = process.env.LAB_MOBILE === '1';
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: mobile, hasTouch: mobile });
    // WebSocket não passa por page.route: mock local que nunca conecta a servidor real.
    const wsAttempts = [];
    await context.routeWebSocket(/.*/, (ws) => { wsAttempts.push(new URL(ws.url()).hostname); ws.close(); });
    await context.addCookies([{ name: 'jwt_token', value: 'fixture-not-a-real-token', url: BASE }]);
    await context.addInitScript(() => localStorage.setItem('avalia.auth.session_hint', '1'));
    const page = await context.newPage();
    if (mobile) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    // cookie banner sintético já respondido (evita sobreposição nas medições)
    await context.addInitScript(() => localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true })));
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 240)));
    page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console: ' + m.text().slice(0, 300)); });
    const requests = [];
    const blocked = new Set();
    await page.route('**/*', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const isApi = url.pathname.includes('/api/v1/') || url.hostname.startsWith('api.');
      if (isApi) {
        const started = Date.now();
        const slow = process.env.LAB_SLOW_PATH && url.pathname.endsWith(process.env.LAB_SLOW_PATH) ? Number(process.env.LAB_SLOW_MS || 4000) : 0;
        await new Promise((r) => setTimeout(r, DELAY_MS + slow));
        const body = fixtureFor(url, req.method());
        requests.push({ method: req.method(), path: url.pathname.replace(/\/\d+(?=\/|$)/g, '/:id'), query: [...url.searchParams.keys()].sort().join(','), host: url.hostname === '127.0.0.1' ? 'local' : 'external-mocked', t: started });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      }
      if (url.hostname !== '127.0.0.1') {
        blocked.add(url.hostname);
        return route.abort();
      }
      if (url.searchParams.has('_rsc')) requests.push({ method: req.method(), path: 'RSC ' + url.pathname, query: [...url.searchParams.keys()].filter((k) => k !== '_rsc').sort().join(','), host: 'local', t: Date.now() });
      return route.continue();
    });
    const longTasks = [];
    await page.addInitScript(() => {
      window.__lt = [];
      new PerformanceObserver((list) => list.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true });
    });

    const t0 = Date.now();
    await page.goto(`${BASE}/dashboard?company_id=9001`, { waitUntil: 'domcontentloaded' });
    const nav = { url: page.url() };
    try {
      await page.waitForSelector('[role="tablist"], nav[aria-label], aside', { timeout: 20000 });
      nav.shellMs = Date.now() - t0;
    } catch { nav.shellMs = null; }
    await page.waitForTimeout(4000);
    nav.settledRequests = requests.length;
    const perf = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      const res = performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'script');
      return {
        domInteractive: Math.round(n.domInteractive), loadEnd: Math.round(n.loadEventEnd),
        scripts: res.length, scriptTransferKB: Math.round(res.reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0) / 1024),
        longTasks: window.__lt, domNodes: document.getElementsByTagName('*').length,
        heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      };
    });
    if (i === 0) await page.screenshot({ path: path.join(OUT, `${SCENARIO}-overview.png`) });

    let extra = null;
    if (SCENARIO === 'warm') {
      const w0 = Date.now(); const r0 = requests.length;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('aside', { timeout: 20000 }).catch(() => undefined);
      extra = { warmShellMs: Date.now() - w0 };
      await page.waitForTimeout(4000);
      extra.warmRequests = requests.slice(r0).filter((r) => !r.path.includes('web-vitals')).length;
      extra.warmLongTasks = await page.evaluate(() => window.__lt.slice());
    }
    if (SCENARIO === 'alias') {
      await page.goto(`${BASE}/dashboard?company_id=9001&tab=info`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: path.join(OUT, 'alias.png') });
      extra = { crashed: (await page.getByText('Erro Crítico').count()) > 0, pageErrors: [...new Set(pageErrors)].slice(0, 4), finalUrl: new URL(page.url()).search, activeNav: await page.locator('aside [aria-current], aside [data-state="active"], aside .bg-primary').allInnerTexts().catch(() => []), mainHead: (await page.locator('main h1, main h2').allInnerTexts().catch(() => [])).slice(0, 4), selectedTab: await page.locator('[role="tab"][aria-selected="true"], [aria-current="page"]').allInnerTexts().catch(() => []) };
    }
    if (SCENARIO === 'race') {
      // Troca A->B pela UI enquanto /companies/9001 está lento (LAB_SLOW_PATH=/companies/9001)
      const switcher = page.getByRole('button', { name: /FIXTURE Solar A/ }).first();
      await switcher.click({ timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(400);
      await page.getByText('FIXTURE Solar B', { exact: false }).last().click({ timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(Number(process.env.LAB_SLOW_MS || 4000) + 2500);
      const header = await page.locator('header, [data-testid*="company"], button').filter({ hasText: /FIXTURE Solar/ }).allInnerTexts();
      extra = { url: new URL(page.url()).search, headerTexts: header.slice(0, 4), greeting: await page.getByText(/Olá,/).first().innerText().catch(() => null),
        bodyHasA: (await page.locator('main').innerText().catch(() => '')).includes('FIXTURE Solar A'), mainSnippet: (await page.locator('main').innerText().catch(() => '')).slice(0, 300), companyFetches: requests.filter((r) => /\/companies\/:id$/.test(r.path)).length };
      await page.screenshot({ path: path.join(OUT, `race-run${i + 1}.png`) });
    }
    let tabs = null;
    if (SCENARIO === 'tabs') {
      tabs = [];
      const before = requests.length;
      const tabButtons = page.locator('[role="tab"], aside a, aside button');
      const count = Math.min(await tabButtons.count(), 12);
      for (let k = 0; k < count; k++) {
        const el = tabButtons.nth(k);
        const label = ((await el.innerText({ timeout: 1000 }).catch(() => '')) || (await el.getAttribute('aria-label', { timeout: 1000 }).catch(() => '')) || '').trim().slice(0, 40);
        if (!label || !(await el.isVisible().catch(() => false))) continue;
        const r0 = requests.length;
        const c0 = Date.now();
        await el.click({ timeout: 3000 }).catch(() => undefined);
        await page.waitForTimeout(1500);
        tabs.push({ label, ms: Date.now() - c0, newRequests: requests.slice(r0).map((r) => `${r.method} ${r.path}${r.query ? '?' + r.query : ''}`), url: new URL(page.url()).search });
      }
      tabs.totalRequests = requests.length - before;
    }
    results.push({ run: i + 1, extra, wsAttemptsBlocked: wsAttempts, totalMs: Date.now() - t0, nav, perf, requests: requests.map(({ t, ...r }) => r), blockedHosts: [...blocked], tabs });
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `${SCENARIO}${process.env.LAB_TAG || ''}.json`), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map((r) => ({ run: r.run, shellMs: r.nav.shellMs, url: r.nav.url, reqs: r.requests.length, lt: r.perf.longTasks.length, ltSum: r.perf.longTasks.reduce((a, b) => a + b, 0), scripts: r.perf.scripts, kb: r.perf.scriptTransferKB, dom: r.perf.domNodes, heap: r.perf.heapMB, blocked: r.blockedHosts }))));
}
run().catch((e) => { console.error(e); process.exit(1); });
