#!/usr/bin/env node

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--') && arg.includes('='))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split('=');
      return [key, value.join('=')];
    })
);

const numberOption = (name, fallback) => {
  const value = Number(args.get(name) || process.env[`SEO_AUDIT_${name.toUpperCase()}`]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const DEFAULT_BASE_URL =
  args.get('base') || process.env.SEO_AUDIT_BASE_URL || 'https://www.avaliasolar.com.br';
const REQUEST_TIMEOUT_MS = numberOption('timeout', 10_000);
const MAX_URLS = numberOption('max', 750);
const CONCURRENCY = numberOption('concurrency', 8);

const forbiddenPathPatterns = [
  /^\/admin(?:\/|$)/,
  /^\/api(?:\/|$)/,
  /^\/dashboard(?:\/|$)/,
  /^\/company-dashboard(?:\/|$)/,
  /^\/review-dashboard(?:\/|$)/,
  /^\/favorites(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/login(?:\/|$)/,
  /^\/logout(?:\/|$)/,
  /^\/register(?:\/|$)/,
  /^\/signup(?:\/|$)/,
  /^\/register-user(?:\/|$)/,
  /^\/forgot-password(?:\/|$)/,
  /^\/reset-password(?:\/|$)/,
  /^\/confirm-email(?:\/|$)/,
  /^\/search(?:\/|$)/,
  /^\/compare(?:\/|$)/,
  /^\/quote-wizard(?:\/|$)/,
  /^\/select-company(?:\/|$)/,
  /^\/chat(?:\/|$)/,
  /^\/companies\/[^/]+\/(?:review|claim|quote)(?:\/|$)/,
];

const xmlValues = (xml, tag) => {
  const pattern = new RegExp(`<${tag}>([^<]+)</${tag}>`, 'g');
  return [...xml.matchAll(pattern)].map((match) =>
    match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
  );
};

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AvaliaSolarSeoAudit/1.0',
        Accept: 'application/xml,text/xml,text/html,*/*',
      },
    });

    return {
      url,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - startedAt,
      text: await response.text().catch(() => ''),
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: error?.name === 'AbortError' ? 'TIMEOUT' : 'ERROR',
      ms: Date.now() - startedAt,
      text: '',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getSitemapUrls(baseUrl) {
  const root = new URL('/sitemap-index.xml', baseUrl).toString();
  const index = await fetchText(root);
  if (!index.ok) {
    throw new Error(`Could not fetch sitemap index ${root}: ${index.status}`);
  }

  const sitemapUrls = xmlValues(index.text, 'loc').filter((url) => url.includes('/sitemaps/'));
  const urlSet = new Set();

  for (const sitemapUrl of sitemapUrls) {
    if (urlSet.size >= MAX_URLS) break;

    const sitemap = await fetchText(sitemapUrl);
    if (!sitemap.ok) {
      urlSet.add(`SITEMAP_FETCH_FAILED:${sitemapUrl}:${sitemap.status}`);
      continue;
    }

    for (const url of xmlValues(sitemap.text, 'loc')) {
      if (urlSet.size >= MAX_URLS) break;
      urlSet.add(url);
    }
  }

  return [...urlSet];
}

function classifyUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return {
      hasQuery: parsed.search.length > 0,
      forbidden: forbiddenPathPatterns.some((pattern) => pattern.test(path)),
    };
  } catch {
    return {
      hasQuery: true,
      forbidden: true,
    };
  }
}

async function mapLimited(items, limit, worker) {
  const results = [];
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      results.push(await worker(current));
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function main() {
  const urls = await getSitemapUrls(DEFAULT_BASE_URL);
  const staticFailures = urls
    .map((url) => ({ url, ...classifyUrl(url) }))
    .filter((item) => item.hasQuery || item.forbidden || item.url.startsWith('SITEMAP_FETCH_FAILED:'));

  const checked = await mapLimited(
    urls.filter((url) => !url.startsWith('SITEMAP_FETCH_FAILED:')),
    CONCURRENCY,
    async (url) => {
      const result = await fetchText(url);
      return {
        url,
        status: result.status,
        ms: result.ms,
      };
    }
  );

  const badStatus = checked.filter((item) => item.status !== 200);
  const slow = checked.filter((item) => Number(item.ms) > 3_000);

  console.log(`SEO sitemap audit for ${DEFAULT_BASE_URL}`);
  console.log(`Sitemap URLs checked: ${checked.length}`);
  console.log(`Forbidden/query entries: ${staticFailures.length}`);
  console.log(`Bad statuses: ${badStatus.length}`);
  console.log(`Slow >3000ms: ${slow.length}`);

  const printTop = (title, items) => {
    if (items.length === 0) return;
    console.log(`\n${title}`);
    items.slice(0, 25).forEach((item) => {
      console.log(`- ${item.status || 'STATIC'} ${item.ms ? `${item.ms}ms ` : ''}${item.url}`);
    });
  };

  printTop('Forbidden/query examples', staticFailures);
  printTop('Bad status examples', badStatus);
  printTop('Slow examples', slow.sort((a, b) => b.ms - a.ms));

  if (staticFailures.length > 0 || badStatus.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
