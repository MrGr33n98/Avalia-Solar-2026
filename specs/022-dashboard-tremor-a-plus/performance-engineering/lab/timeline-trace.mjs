// Spec 022 — trace de timeline da main thread no cold load do /dashboard (lab).
// Quebra o "(program)" do CPU profile por tipo de evento (compile, eval, style,
// layout, parse de CSS/HTML, GC). Mesmas fixtures/isolamento de cpu-profile.mjs.
// Uso: FRONT_DIR=... LAB_OUT=... [LAB_MOBILE=1] node timeline-trace.mjs <label> [runs]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { chromium } = require('@playwright/test');

const BASE = process.env.LAB_BASE || 'http://127.0.0.1:3100';
const OUT = process.env.LAB_OUT;
const LABEL = process.argv[2] || 'trace';
const RUNS = Number(process.argv[3] || 3);
const MOBILE = process.env.LAB_MOBILE === '1';
const SETTLE_MS = Number(process.env.LAB_SETTLE_MS || 8000);

const company = (id, name) => ({ id, name, slug: `fixture-${id}`, city: 'Florianópolis', state: 'SC',
  status: 'active', logo_url: null, plan: 'pro', plan_tier: 'pro', role: 'owner', membership_role: 'owner',
  verified: true, rating_average: null, reviews_count: 0 });
const FEATURES = ['advanced_analytics', 'ai_live_inbox', 'company_ai_assistant', 'downloadable_materials',
  'leads_marketplace', 'media_gallery', 'notifications', 'promo_banner', 'sponsored_description', 'webhooks',
  'intent_scores'];
function fixtureFor(url, method) {
  const p = url.pathname.replace(/^.*\/api\/v1/, '');
  if (p === '/auth/me') return { user: { id: 1, name: 'FIXTURE Owner', email: 'owner@fixture.invalid',
    role: 'company', company_id: 9001, status: 'active', approved_by_admin: true } };
  if (p === '/companies/mine' || p === '/users/me_companies') return [company(9001, 'FIXTURE Solar A'), company(9002, 'FIXTURE Solar B')];
  if (/^\/companies\/\d+\/feature_access$/.test(p)) return { plan: 'pro', subscription: { status: 'active' },
    features: Object.fromEntries(FEATURES.map((k) => [k, { state: 'enabled' }])) };
  const m = p.match(/^\/companies\/(\d+)$/);
  if (m) return company(Number(m[1]), Number(m[1]) === 9002 ? 'FIXTURE Solar B' : 'FIXTURE Solar A');
  if (p.includes('timeseries')) return { series: [] };
  if (p.includes('/leads')) return [];
  if (p.includes('notifications')) return { notifications: [] };
  if (p.includes('top_campaigns')) return { campaigns: [] };
  return method === 'GET' ? {} : { ok: true };
}

// Agrupa nomes de evento do Chrome em categorias legíveis.
const GROUPS = {
  'Compilar JS': ['v8.compile', 'V8.CompileCode', 'v8.compileModule', 'CompileScript', 'V8.CompileLazy'],
  'Avaliar JS (topo)': ['EvaluateScript', 'v8.evaluateModule'],
  'Executar JS (callbacks/eventos)': ['FunctionCall', 'TimerFire', 'FireAnimationFrame', 'EventDispatch',
    'v8.callFunction', 'RunMicrotasks', 'FireIdleCallback'],
  'Recalcular estilo': ['UpdateLayoutTree', 'RecalculateStyles'],
  'Layout': ['Layout'],
  'Parse CSS': ['ParseAuthorStyleSheet'],
  'Parse HTML': ['ParseHTML'],
  'Pintura/composição': ['Paint', 'PrePaint', 'Layerize', 'UpdateLayer', 'CompositeLayers', 'Commit'],
  GC: ['MinorGC', 'MajorGC', 'V8.GCScavenger', 'V8.GCFinalizeMC', 'BlinkGC.AtomicPhase'],
};
const groupOf = new Map(Object.entries(GROUPS).flatMap(([g, names]) => names.map((n) => [n, g])));

function summarize(events) {
  const meta = events.filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain');
  const mainTids = new Set(meta.map((e) => `${e.pid}:${e.tid}`));
  // Só eventos "X" (complete) da main thread; mede self-time aproximado por categoria
  // descontando filhos de categorias também medidas, para não contar duas vezes.
  const xs = events.filter((e) => e.ph === 'X' && mainTids.has(`${e.pid}:${e.tid}`) && groupOf.has(e.name))
    .map((e) => ({ g: groupOf.get(e.name), ts: e.ts, end: e.ts + (e.dur || 0), dur: e.dur || 0 }))
    .sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const totals = {};
  const stack = [];
  for (const ev of xs) {
    while (stack.length && stack[stack.length - 1].end <= ev.ts) stack.pop();
    const parent = stack[stack.length - 1];
    totals[ev.g] = (totals[ev.g] || 0) + ev.dur;
    if (parent) totals[parent.g] -= Math.min(ev.dur, parent.end - ev.ts);
    stack.push(ev);
  }
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round(v / 1000)]));
}

async function runOnce(browser) {
  const context = await browser.newContext({
    viewport: MOBILE ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: MOBILE, hasTouch: MOBILE });
  await context.routeWebSocket(/.*/, (ws) => ws.close());
  await context.addCookies([{ name: 'jwt_token', value: 'fixture-not-a-real-token', url: BASE }]);
  await context.addInitScript(() => {
    localStorage.setItem('avalia.auth.session_hint', '1');
    localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true }));
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (MOBILE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1/')) {
      await new Promise((r) => setTimeout(r, 120));
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(fixtureFor(url, route.request().method())) });
    }
    if (url.origin !== new URL(BASE).origin) return route.abort();
    return route.continue();
  });
  const events = [];
  cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {
    transferMode: 'ReportEvents',
    traceConfig: { includedCategories: ['devtools.timeline', 'v8', 'v8.execute', 'blink', 'disabled-by-default-devtools.timeline',
      '__metadata'] },
  });
  await page.goto(`${BASE}/dashboard?company_id=9001`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(SETTLE_MS);
  await cdp.send('Tracing.end');
  await done;
  await context.close();
  return summarize(events);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await runOnce(browser));
  await browser.close();
  const keys = [...new Set(runs.flatMap((r) => Object.keys(r)))];
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };
  const median = Object.fromEntries(keys.map((k) => [k, med(runs.map((r) => r[k] || 0))]).sort((a, b) => b[1] - a[1]));
  fs.writeFileSync(path.join(OUT, `${LABEL}-timeline.json`), JSON.stringify({ label: LABEL, mobile: MOBILE, median, runs }, null, 2));
  console.log(JSON.stringify({ label: LABEL, mobile: MOBILE, median }));
}
main().catch((e) => { console.error(e); process.exit(1); });
