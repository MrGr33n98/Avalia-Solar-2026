import { createRequire } from 'node:module';
const require = createRequire(process.env.FRONT_DIR + '/package.json');
const { chromium } = require('@playwright/test');
const BASE = 'http://127.0.0.1:3100';
const tabs = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
for (const tab of tabs) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addCookies([{ name: 'jwt_token', value: 'fixture-not-a-real-token', url: BASE }]);
  await ctx.addInitScript(() => localStorage.setItem('avalia.auth.session_hint', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 220)));
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1/')) {
      const p = url.pathname.replace(/^.*\/api\/v1/, '');
      let body = {};
      if (p === '/auth/me') body = { user: { id: 1, name: 'FIXTURE Owner', email: 'o@fixture.invalid', role: 'company', company_id: 9001, status: 'active' } };
      else if (p === '/companies/mine') body = [{ id: 9001, name: 'FIXTURE Solar A', slug: 'fixture-9001', city: 'X', state: 'SC' }];
      else if (/^\/companies\/\d+\/feature_access$/.test(p)) body = { plan: 'pro', subscription: { status: 'active' }, features: Object.fromEntries(['advanced_analytics','ai_live_inbox','company_ai_assistant','downloadable_materials','leads_marketplace','media_gallery','notifications','promo_banner','sponsored_description','webhooks','intent_scores'].map((k) => [k, { state: 'enabled' }])) };
      else if (/^\/companies\/\d+$/.test(p)) body = { id: 9001, name: 'FIXTURE Solar A', slug: 'fixture-9001', city: 'X', state: 'SC' };
      else if (p.includes('/leads')) body = [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (url.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
  await page.goto(`${BASE}/dashboard?company_id=9001&tab=${tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const crashed = await page.getByText('Erro Crítico').count();
  console.log(JSON.stringify({ tab, finalUrl: new URL(page.url()).search, crashed: crashed > 0, errors: [...new Set(errors)].slice(0, 3) }));
  await ctx.close();
}
await browser.close();
