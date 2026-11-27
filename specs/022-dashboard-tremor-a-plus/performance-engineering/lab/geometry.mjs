// Spec 022 — baseline geométrico da sidebar/conteúdo (lab, fixtures sintéticas).
// Mede, depois da página estabilizar, largura da <aside> e padding-left do conteúdo
// que consome --enterprise-sidebar-width, por largura de viewport e rota.
// Uso: FRONT_DIR=... LAB_OUT=... node geometry.mjs <label>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { chromium } = require('@playwright/test');

const BASE = process.env.LAB_BASE || 'http://127.0.0.1:3100';
const OUT = process.env.LAB_OUT;
const LABEL = process.argv[2] || 'geometry';
const WIDTHS = [390, 767, 768, 1024, 1179, 1180, 1280];
const ROUTES = ['/dashboard?company_id=9001', '/dashboard/icp', '/dashboard/inbox'];

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
  if (p.includes('/leads')) return [];
  if (p.includes('notifications')) return { notifications: [] };
  return method === 'GET' ? {} : { ok: true };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const rows = [];
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.routeWebSocket(/.*/, (ws) => ws.close());
      await context.addCookies([{ name: 'jwt_token', value: 'fixture-not-a-real-token', url: BASE }]);
      await context.addInitScript(() => {
        localStorage.setItem('avalia.auth.session_hint', '1');
        localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true }));
        localStorage.setItem('active_company', JSON.stringify({ id: 9001, name: 'FIXTURE Solar A' }));
      });
      const page = await context.newPage();
      await page.route('**/*', async (r) => {
        const url = new URL(r.request().url());
        if (url.pathname.includes('/api/v1/')) {
          return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureFor(url, r.request().method())) });
        }
        if (url.origin !== new URL(BASE).origin) return r.abort();
        return r.continue();
      });
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(6000);
      const g = await page.evaluate(() => {
        const aside = [...document.querySelectorAll('aside')].find((a) => getComputedStyle(a).position === 'fixed');
        const content = document.querySelector('[class*="enterprise-sidebar-width"]');
        const rect = aside ? aside.getBoundingClientRect() : null;
        return {
          asideVisible: !!aside && getComputedStyle(aside).display !== 'none' && rect.width > 0,
          asideWidth: rect ? Math.round(rect.width) : null,
          contentPaddingLeft: content ? getComputedStyle(content).paddingLeft : null,
          cssVar: getComputedStyle(document.documentElement).getPropertyValue('--enterprise-sidebar-width').trim() || null,
          crashed: document.body.innerText.includes('Erro Crítico'),
          url: location.pathname + location.search,
        };
      });
      if (width === 1280 || width === 390) {
        await page.screenshot({ path: path.join(OUT, `${LABEL}-${route.split('?')[0].replace(/\//g, '_')}-${width}.png`) });
      }
      rows.push({ route, width, ...g });
      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `${LABEL}-geometry.json`), JSON.stringify(rows, null, 2));
  for (const r of rows) {
    console.log(`${r.route.padEnd(28)} ${String(r.width).padStart(4)}  aside=${r.asideVisible ? r.asideWidth : '-'}  pl=${r.contentPaddingLeft}  var=${r.cssVar}${r.crashed ? '  CRASH' : ''}  ${r.url}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
