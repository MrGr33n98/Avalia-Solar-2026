// Spec 022 — laboratório de CPU do /dashboard (NÃO é código de produto).
// Build de produção local + Playwright + CDP Profiler (sampling). Todo /api/v1 é
// respondido por fixtures sintéticas (tenants FIXTURE A/B 9001/9002), WebSocket
// mockado e hosts externos bloqueados. Nenhuma credencial ou dado real.
//
// Uso: FRONT_DIR=... LAB_OUT=... node cpu-profile.mjs <label> [runs]
//   LAB_MOBILE=1      viewport 390x844 + CPU 4×
//   LAB_BASE          default http://127.0.0.1:3100
//   LAB_TAB           aba inicial (default overview)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { chromium } = require('@playwright/test');

const BASE = process.env.LAB_BASE || 'http://127.0.0.1:3100';
const OUT = process.env.LAB_OUT;
const LABEL = process.argv[2] || 'run';
const RUNS = Number(process.argv[3] || 5);
const MOBILE = process.env.LAB_MOBILE === '1';
const TAB = process.env.LAB_TAB || '';
const DELAY_MS = Number(process.env.LAB_API_DELAY_MS || 120);
const SETTLE_MS = Number(process.env.LAB_SETTLE_MS || 8000);

const iso = (d = 0) => new Date(Date.UTC(2026, 10, 20 - d)).toISOString();
const company = (id, name) => ({
  id, name, slug: `fixture-${id}`, city: 'Florianópolis', state: 'SC', status: 'active', logo_url: null,
  plan: 'pro', plan_tier: 'pro', role: 'owner', membership_role: 'owner', verified: true,
  rating_average: null, reviews_count: 0,
});
const A = company(9001, 'FIXTURE Solar A');
const B = company(9002, 'FIXTURE Solar B');
const FEATURE_KEYS = ['advanced_analytics', 'ai_live_inbox', 'company_ai_assistant', 'downloadable_materials',
  'leads_marketplace', 'media_gallery', 'notifications', 'promo_banner', 'sponsored_description', 'webhooks',
  'intent_scores'];

function fixtureFor(url, method) {
  const p = url.pathname.replace(/^.*\/api\/v1/, '');
  if (p === '/auth/me') {
    return { user: { id: 1, name: 'FIXTURE Owner', email: 'owner@fixture.invalid', role: 'company',
      company_id: 9001, status: 'active', approved_by_admin: true } };
  }
  if (p === '/companies/mine' || p === '/users/me_companies') return [A, B];
  let m = p.match(/^\/companies\/(\d+)\/feature_access$/);
  if (m) {
    return { plan: 'pro', subscription: { status: 'active' },
      features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, { state: 'enabled' }])) };
  }
  m = p.match(/^\/companies\/(\d+)$/);
  if (m) return Number(m[1]) === 9002 ? B : A;
  if (p.includes('timeseries')) {
    return { series: Array.from({ length: 60 }, (_, i) => ({ date: iso(i).slice(0, 10), views: 10 + (i % 7),
      clicks: i % 5, leads: i % 3 })) };
  }
  if (p.includes('/leads')) return [];
  if (p.includes('notifications')) return { notifications: [] };
  if (p.includes('top_campaigns')) return { campaigns: [] };
  if (method !== 'GET') return { ok: true };
  return {};
}

async function runOnce(browser, i) {
  const context = await browser.newContext({
    viewport: MOBILE ? { width: 390, height: 844 } : { width: 1280, height: 800 },
    isMobile: MOBILE, hasTouch: MOBILE,
  });
  await context.routeWebSocket(/.*/, (ws) => ws.close());
  await context.addCookies([{ name: 'jwt_token', value: 'fixture-not-a-real-token', url: BASE }]);
  await context.addInitScript(() => {
    localStorage.setItem('avalia.auth.session_hint', '1');
    localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true }));
    // Prontidão do shell medida na própria página (sem locators do Playwright, cujo
    // script injetado roda na main thread e contamina long tasks/TBT).
    window.__shellAt = null;
    const shellTimer = setInterval(() => {
      if (document.querySelector('[aria-label="Alternar Empresa"], [role="tabpanel"]')) {
        window.__shellAt = Math.round(performance.now());
        clearInterval(shellTimer);
      }
    }, 250);
    window.__lt = [];
    new PerformanceObserver((list) => list.getEntries().forEach((e) =>
      window.__lt.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) })))
      .observe({ type: 'longtask', buffered: true });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (MOBILE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const requests = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.includes('/api/v1/')) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      requests.push(`${req.method()} ${url.pathname.replace(/\/\d+(?=\/|$)/g, '/:id')}`);
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(fixtureFor(url, req.method())) });
    }
    if (url.origin !== new URL(BASE).origin) return route.abort();
    return route.continue();
  });

  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Performance.enable');
  await cdp.send('Profiler.start');
  const target = `${BASE}/dashboard?company_id=9001${TAB ? `&tab=${TAB}` : ''}`;
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(SETTLE_MS);
  const { profile } = await cdp.send('Profiler.stop');
  const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  // Leituras só depois do fim da janela medida.
  const { lt, shellAt, crashed } = await page.evaluate(() => ({
    lt: window.__lt,
    shellAt: window.__shellAt,
    crashed: document.body.innerText.includes('Erro Crítico'),
  }));
  const shellMs = shellAt;

  const file = path.join(OUT, `${LABEL}-run${i + 1}.cpuprofile`);
  fs.writeFileSync(file, JSON.stringify(profile));
  await context.close();
  return {
    run: i + 1, shellMs, crashed, errors: [...new Set(errors)].slice(0, 3),
    longTasks: lt.length, longTaskSumMs: lt.reduce((s, t) => s + t.dur, 0),
    maxLongTaskMs: lt.reduce((m, t) => Math.max(m, t.dur), 0),
    tbtMs: lt.reduce((s, t) => s + Math.max(0, t.dur - 50), 0),
    scriptMs: Math.round((metrics.ScriptDuration || 0) * 1000),
    layoutMs: Math.round((metrics.LayoutDuration || 0) * 1000),
    styleMs: Math.round((metrics.RecalcStyleDuration || 0) * 1000),
    heapMB: Math.round((metrics.JSHeapUsedSize || 0) / 1048576),
    domNodes: metrics.Nodes, apiRequests: requests.length,
    profile: path.basename(file),
  };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await runOnce(browser, i));
  await browser.close();
  const keys = ['shellMs', 'longTasks', 'longTaskSumMs', 'maxLongTaskMs', 'tbtMs', 'scriptMs', 'layoutMs',
    'styleMs', 'heapMB', 'domNodes', 'apiRequests'];
  const summary = { label: LABEL, mobile: MOBILE, tab: TAB || 'overview', runs: RUNS,
    median: Object.fromEntries(keys.map((k) => [k, median(runs.map((r) => r[k]))])),
    crashes: runs.filter((r) => r.crashed).length, runsDetail: runs };
  fs.writeFileSync(path.join(OUT, `${LABEL}-summary.json`), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ label: LABEL, mobile: MOBILE, ...summary.median, crashes: summary.crashes }));
}
main().catch((e) => { console.error(e); process.exit(1); });
