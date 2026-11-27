// Spec 022 — atribuição de render do React por componente (lab).
// Requer build `next build --profile` (React com profiler; nomes preservados).
// Overhead do profiler: usar para ATRIBUIR, não para medir tempo absoluto.
// Uso: FRONT_DIR=... LAB_OUT=... [LAB_MOBILE=1] node react-commits.mjs <label> [runs]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { chromium } = require('@playwright/test');

const BASE = process.env.LAB_BASE || 'http://127.0.0.1:3100';
const OUT = process.env.LAB_OUT;
const LABEL = process.argv[2] || 'react';
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

// Roda na página antes do React: coleta, por commit, os fibers que renderizaram.
function installHook() {
  const stats = { commits: 0, byName: {}, commitDurations: [] };
  window.__reactStats = stats;
  window.__reactTypes = {};
  const nameOf = (f) => {
    const t = f.type;
    if (!t) return null;
    if (typeof t === 'string') return null; // host component (div, span…)
    return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name))
      || (t.type && (t.type.displayName || t.type.name)) || null;
  };
  const walk = (fiber) => {
    let total = 0;
    const stack = [fiber];
    while (stack.length) {
      const f = stack.pop();
      // PerformedWork (0b1): o fiber executou render neste commit.
      if ((f.flags & 1) === 1 || f.alternate === null) {
        const n = nameOf(f);
        if (n) {
          const fnType = typeof f.type === 'function' ? f.type : (f.type && (f.type.render || f.type.type));
          if (typeof fnType === 'function' && !window.__reactTypes[n]) window.__reactTypes[n] = fnType;
          const s = stats.byName[n] || (stats.byName[n] = { renders: 0, selfMs: 0, actualMs: 0 });
          s.renders += 1;
          s.selfMs += f.selfBaseDuration || 0;
          s.actualMs += f.actualDuration || 0;
        }
      }
      if (f.child) stack.push(f.child);
      if (f.sibling) stack.push(f.sibling);
      total += 0;
    }
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject(renderer) { const id = this.renderers.size + 1; this.renderers.set(id, renderer); return id; },
    onCommitFiberRoot(_id, root) {
      stats.commits += 1;
      if (root.current) {
        stats.commitDurations.push(Math.round(root.current.actualDuration || 0));
        walk(root.current.child);
      }
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    checkDCE() {},
  };
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
  await context.addInitScript(installHook);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (MOBILE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const scripts = new Map();
  cdp.on('Debugger.scriptParsed', (e) => scripts.set(e.scriptId, e.url));
  await cdp.send('Debugger.enable');
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
  await page.goto(`${BASE}/dashboard?company_id=9001`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(SETTLE_MS);
  const stats = await page.evaluate(() => window.__reactStats);
  // Resolve a posição de origem dos componentes mais caros (nomes minificados).
  const top = Object.entries(stats.byName).sort((a, b) => b[1].selfMs - a[1].selfMs).slice(0, 30).map(([n]) => n);
  stats.locations = {};
  for (const n of top) {
    const { result } = await cdp.send('Runtime.evaluate', { expression: `window.__reactTypes[${JSON.stringify(n)}]` });
    if (!result.objectId) continue;
    const props = await cdp.send('Runtime.getProperties', { objectId: result.objectId, ownProperties: true });
    const loc = (props.internalProperties || []).find((p) => p.name === '[[FunctionLocation]]');
    if (loc) {
      const v = loc.value.value;
      stats.locations[n] = { url: scripts.get(v.scriptId) || '', line: v.lineNumber, column: v.columnNumber };
    }
  }
  await context.close();
  return stats;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await runOnce(browser));
  await browser.close();
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };
  const names = [...new Set(runs.flatMap((r) => Object.keys(r.byName)))];
  const rows = names.map((n) => ({
    name: n,
    renders: med(runs.map((r) => r.byName[n]?.renders || 0)),
    selfMs: Math.round(med(runs.map((r) => r.byName[n]?.selfMs || 0))),
  })).sort((a, b) => b.selfMs - a.selfMs);
  const { SourceMapConsumer } = require('source-map-js');
  const where = {};
  for (const [n, loc] of Object.entries(runs[0].locations || {})) {
    const m = loc.url.match(/\/_next\/(static\/.+\.js)/);
    if (!m) continue;
    const mapFile = path.join(process.env.FRONT_DIR, '.next', `${m[1]}.map`);
    if (!fs.existsSync(mapFile)) continue;
    const c = new SourceMapConsumer(JSON.parse(fs.readFileSync(mapFile, 'utf8')));
    const p = c.originalPositionFor({ line: loc.line + 1, column: loc.column });
    if (p.source) where[n] = `${p.source.replace(/^webpack:\/\/(_N_E\/)?/, '').replace(/^\.\//, '')}:${p.line}${p.name ? ` (${p.name})` : ''}`;
  }
  rows.forEach((r) => { if (where[r.name]) r.source = where[r.name]; });
  const summary = {
    label: LABEL, mobile: MOBILE, commits: med(runs.map((r) => r.commits)),
    commitMsTotal: med(runs.map((r) => r.commitDurations.reduce((s, x) => s + x, 0))),
    topCommitsMs: runs[0].commitDurations.slice().sort((a, b) => b - a).slice(0, 10),
    bySelf: rows.slice(0, 40),
    byRenders: rows.slice().sort((a, b) => b.renders - a.renders).slice(0, 25),
  };
  fs.writeFileSync(path.join(OUT, `${LABEL}-react.json`), JSON.stringify(summary, null, 2));
  console.log(`commits=${summary.commits} commitMsTotal=${summary.commitMsTotal} topCommits=${summary.topCommitsMs}`);
  console.log('--- por self (selfBaseDuration) ---');
  summary.bySelf.slice(0, 25).forEach((r) => console.log(`${String(r.selfMs).padStart(6)}ms ${String(r.renders).padStart(4)}x  ${r.name}${r.source ? '  <- ' + r.source : ''}`));
  console.log('--- por nº de renders ---');
  summary.byRenders.slice(0, 15).forEach((r) => console.log(`${String(r.renders).padStart(4)}x ${String(r.selfMs).padStart(6)}ms  ${r.name}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
