// Spec 022 — mapeia layouts/estilos síncronos forçados no cold load do /dashboard (lab).
// Envolve APIs que forçam flush (getComputedStyle + leitura, getBoundingClientRect,
// offset*/client*/scroll*, innerWidth/innerHeight) e mede a duração de cada chamada
// (inclui o flush forçado). Pilhas resolvidas por source maps.
// Uso: FRONT_DIR=... LAB_OUT=... [LAB_MOBILE=1] node forced-layout.mjs <label>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { chromium } = require('@playwright/test');
const { SourceMapConsumer } = require('source-map-js');

const BASE = process.env.LAB_BASE || 'http://127.0.0.1:3100';
const OUT = process.env.LAB_OUT;
const LABEL = process.argv[2] || 'forced';
const MOBILE = process.env.LAB_MOBILE === '1';
const SETTLE_MS = Number(process.env.LAB_SETTLE_MS || 10000);

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

function instrument() {
  const records = [];
  window.__forced = records;
  const describe = (el) => {
    if (!el || !el.tagName) return '';
    const attrs = ['role', 'data-state', 'data-radix-popper-content-wrapper', 'aria-label', 'data-testid']
      .map((a) => (el.getAttribute && el.getAttribute(a) !== null ? `${a}=${el.getAttribute(a)}` : null)).filter(Boolean);
    return `<${el.tagName.toLowerCase()} ${attrs.join(' ')} class="${String(el.className || '').slice(0, 60)}">`;
  };
  const record = (api, t0, el) => {
    const dur = performance.now() - t0;
    if (dur < 2) return; // só chamadas que de fato custaram (flush)
    const stack = (new Error().stack || '').split('\n').slice(3, 12).join('\n');
    records.push({ api, dur, stack, el: describe(el) });
  };
  const origGCS = window.getComputedStyle;
  window.getComputedStyle = function (...args) {
    const style = origGCS.apply(this, args);
    const el = args[0];
    // O flush acontece na leitura de propriedade; envolve a declaração em proxy.
    return new Proxy(style, {
      get(target, prop) {
        const t0 = performance.now();
        const v = Reflect.get(target, prop, target);
        if (typeof prop === 'string' && typeof v !== 'function') record(`getComputedStyle.${prop}`, t0, el);
        return typeof v === 'function' ? v.bind(target) : v;
      },
    });
  };
  const wrapMethod = (proto, name) => {
    const orig = proto[name];
    proto[name] = function (...args) { const t0 = performance.now(); const r = orig.apply(this, args); record(name, t0); return r; };
  };
  wrapMethod(Element.prototype, 'getBoundingClientRect');
  wrapMethod(Element.prototype, 'getClientRects');
  const wrapGetter = (proto, name) => {
    const d = Object.getOwnPropertyDescriptor(proto, name);
    if (!d || !d.get) return;
    Object.defineProperty(proto, name, { ...d, get() { const t0 = performance.now(); const r = d.get.call(this); record(name, t0); return r; } });
  };
  for (const n of ['offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft']) wrapGetter(HTMLElement.prototype, n);
  for (const n of ['clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight', 'scrollTop']) wrapGetter(Element.prototype, n);
  // matchMedia().matches também pode depender de estado de layout; medido à parte.
  if (window.MediaQueryList) wrapGetter(MediaQueryList.prototype, 'matches');
  for (const n of ['innerWidth', 'innerHeight']) {
    const d = Object.getOwnPropertyDescriptor(window, n);
    if (d && d.get) Object.defineProperty(window, n, { ...d, get() { const t0 = performance.now(); const r = d.get.call(window); record(n, t0); return r; } });
  }
}

const consumers = new Map();
function resolveFrame(line) {
  const m = line.match(/(https?:\/\/[^\s)]+\/_next\/(static\/[^\s):]+\.js)):(\d+):(\d+)/);
  if (!m) return null;
  let c = consumers.get(m[2]);
  if (c === undefined) {
    const f = path.join(process.env.FRONT_DIR, '.next', `${m[2]}.map`);
    c = fs.existsSync(f) ? new SourceMapConsumer(JSON.parse(fs.readFileSync(f, 'utf8'))) : null;
    consumers.set(m[2], c);
  }
  if (!c) return null;
  const p = c.originalPositionFor({ line: Number(m[3]), column: Number(m[4]) - 1 });
  if (!p.source) return null;
  return `${p.source.replace(/^webpack:\/\/(_N_E\/)?/, '').replace(/^\.\//, '')}:${p.line}`;
}
const isLib = (s) => /node_modules|^src\/|^\(webpack\)|next\/dist/.test(s);

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: MOBILE ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: MOBILE, hasTouch: MOBILE });
  await context.routeWebSocket(/.*/, (ws) => ws.close());
  await context.addCookies([{ name: 'jwt_token', value: 'fixture-not-a-real-token', url: BASE }]);
  await context.addInitScript(() => {
    localStorage.setItem('avalia.auth.session_hint', '1');
    localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true }));
  });
  await context.addInitScript(instrument);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (MOBILE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1/')) {
      await new Promise((r) => setTimeout(r, 120));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureFor(url, route.request().method())) });
    }
    if (url.origin !== new URL(BASE).origin) return route.abort();
    return route.continue();
  });
  await page.goto(`${BASE}/dashboard?company_id=9001`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(SETTLE_MS);
  const records = await page.evaluate(() => window.__forced);
  await browser.close();

  const byCaller = new Map();
  let total = 0;
  for (const r of records) {
    total += r.dur;
    const frames = r.stack.split('\n').map(resolveFrame).filter(Boolean);
    const lib = frames.find((f) => isLib(f)) || '(sem lib)';
    const app = frames.find((f) => !isLib(f)) || '(sem frame do app)';
    const key = `${r.api.split('.')[0]} | app: ${app} | lib: ${lib}`;
    const e = byCaller.get(key) || { calls: 0, ms: 0 };
    e.calls += 1; e.ms += r.dur;
    byCaller.set(key, e);
  }
  const rows = [...byCaller].map(([k, v]) => ({ key: k, calls: v.calls, ms: Math.round(v.ms) })).sort((a, b) => b.ms - a.ms);
  fs.writeFileSync(path.join(OUT, `${LABEL}-forced.json`), JSON.stringify({ label: LABEL, mobile: MOBILE, totalMs: Math.round(total), calls: records.length, rows }, null, 2));
  console.log(`forced flushes >=2ms: ${records.length} chamadas, ${Math.round(total)}ms`);
  rows.slice(0, 20).forEach((r) => console.log(`${String(r.ms).padStart(6)}ms ${String(r.calls).padStart(3)}x  ${r.key}`));
  console.log('--- elementos (getComputedStyle) ---');
  records.filter((r) => r.api.startsWith('getComputedStyle')).forEach((r) => console.log(`${Math.round(r.dur)}ms ${r.api} ${r.el}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
