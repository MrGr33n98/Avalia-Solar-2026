import type { MetadataRoute } from 'next';

import { buildApiUrl } from '@/lib/api-config';
import {
  BRAZIL_CAPITAL_SOLAR_PAGES,
  BRAZIL_STATE_SOLAR_PAGES,
} from '@/lib/locations/local-page-slugs';
import { buildCategorySegment } from '@/lib/seo/companies-category-url';
import { isLocalPageIndexable } from '@/lib/seo/local-page-quality';
import { CAPITAL_COVERAGE_REPORT } from '@/lib/seo/sector-reports';
import { TRUST_PAGES } from '@/lib/seo/trust-pages';
import { SITE, STATIC_SITEMAP_LAST_MODIFIED, absoluteUrl } from '@/lib/site';

export const SITEMAP_SECTIONS = [
  'static',
  'blog',
  'categories',
  'company-categories',
  'local-rankings',
  'companies',
  'local-solar',
  'creators',
] as const;

export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

type ApiRecord = Record<string, unknown>;

type SitemapEntry = MetadataRoute.Sitemap[number];

const SITEMAP_FETCH_TIMEOUT_MS = 6_000;
const PRIVATE_OR_ACTION_PATH_PATTERNS = [
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
] as const;

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const getString = (record: ApiRecord, key: string) => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const getNumber = (record: ApiRecord, key: string) => {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : undefined;
};

const unwrapData = (payload: unknown): ApiRecord[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  const data = payload.data;
  return Array.isArray(data) ? data.filter(isRecord) : [];
};

const normalizeSitemapEntries = (entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap => {
  const seen = new Set<string>();
  const normalized: MetadataRoute.Sitemap = [];

  entries.forEach((entry) => {
    try {
      const parsed = new URL(entry.url);
      parsed.hash = '';
      parsed.search = '';
      const path = parsed.pathname.replace(/\/+$/, '') || '/';

      if (PRIVATE_OR_ACTION_PATH_PATTERNS.some((pattern) => pattern.test(path))) return;

      const url = parsed.toString();
      if (seen.has(url)) return;
      seen.add(url);
      normalized.push({ ...entry, url });
    } catch {
      // Drop malformed sitemap entries instead of emitting invalid XML.
    }
  });

  return normalized;
};

async function fetchRecords(endpoint: string, revalidate = 3600): Promise<ApiRecord[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(buildApiUrl(endpoint), {
      next: { revalidate },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    return unwrapData(await response.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export function getStaticSitemapEntries(): MetadataRoute.Sitemap {
  const routes = [
    { route: '', priority: 1, changeFrequency: 'daily' as const },
    { route: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/companies', priority: 0.9, changeFrequency: 'daily' as const },
    { route: '/products', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/about', priority: 0.65, changeFrequency: 'monthly' as const },
    { route: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/help', priority: 0.65, changeFrequency: 'monthly' as const },
    ...Object.values(TRUST_PAGES).map((page) => ({
      route: `/${page.slug}`,
      priority: 0.65,
      changeFrequency: 'monthly' as const,
    })),
    { route: CAPITAL_COVERAGE_REPORT.path, priority: 0.6, changeFrequency: 'monthly' as const },
    { route: '/press', priority: 0.55, changeFrequency: 'monthly' as const },
    { route: '/careers', priority: 0.55, changeFrequency: 'monthly' as const },
    { route: '/privacy', priority: 0.45, changeFrequency: 'yearly' as const },
    { route: '/terms', priority: 0.45, changeFrequency: 'yearly' as const },
    { route: '/cookies', priority: 0.4, changeFrequency: 'yearly' as const },
  ];

  return normalizeSitemapEntries(
    routes.map(({ route, priority, changeFrequency }) => ({
      url: absoluteUrl(route || '/'),
      lastModified: STATIC_SITEMAP_LAST_MODIFIED,
      changeFrequency,
      priority,
    }))
  );
}

export async function getBlogSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchRecords('articles?per_page=100');
  const validPosts = await Promise.all(
    posts.map(async (post) => {
      const slug = getString(post, 'slug');
      if (!slug) return null;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(buildApiUrl(`articles/${encodeURIComponent(slug)}`), {
          method: 'GET',
          next: { revalidate: 3600 },
          signal: controller.signal,
        });
        return response.ok ? post : null;
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  return normalizeSitemapEntries(
    validPosts
      .filter((post): post is ApiRecord => Boolean(post))
      .map((post) => ({
      url: absoluteUrl(`/blog/${getString(post, 'slug')}`),
      lastModified: getString(post, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      }))
  );
}

export async function getCategorySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const categories = await fetchRecords('categories?per_page=100');
  return normalizeSitemapEntries(
    categories
      .filter((category) => getString(category, 'seo_url'))
      .map((category) => ({
      url: absoluteUrl(`/categories/${getString(category, 'seo_url')}`),
      lastModified: getString(category, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      }))
  );
}

export async function getCompanyCategorySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const categories = await fetchRecords('categories?per_page=100');
  return normalizeSitemapEntries(
    categories
      .filter((category) => {
      const id = getNumber(category, 'id');
      const name = getString(category, 'name');
      const seoUrl = getString(category, 'seo_url');
      const companiesCount = getNumber(category, 'companies_count') || 0;
      return Boolean(id && name && seoUrl && companiesCount > 0);
      })
      .map((category) => {
      const id = getNumber(category, 'id') as number;
      const name = getString(category, 'name') as string;
      const seoUrl = getString(category, 'seo_url') as string;
      return {
        url: absoluteUrl(
          `/companies/categorias/${buildCategorySegment({ id, name, seo_url: seoUrl })}`
        ),
        lastModified: getString(category, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      };
      })
  );
}

export async function getLocalRankingSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const rankings = await fetchRecords('sitemaps/local_rankings');
  return normalizeSitemapEntries(
    rankings
      .filter((item) => {
      return (
        getString(item, 'category_slug') &&
        getString(item, 'state') &&
        getString(item, 'city_slug')
      );
      })
      .map((item) => ({
      url: absoluteUrl(
        `/melhores-empresas/${getString(item, 'category_slug')}/${getString(
          item,
          'state'
        )}/${getString(item, 'city_slug')}`
      ),
      lastModified: getString(item, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      }))
  );
}

export async function getCompanySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const companies = await fetchRecords('companies?status=active&per_page=100');
  return normalizeSitemapEntries(
    companies
      .filter((company) => getString(company, 'slug'))
      .map((company) => ({
      url: absoluteUrl(`/companies/${getString(company, 'slug')}`),
      lastModified: getString(company, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
      changeFrequency: 'daily' as const,
      priority: 0.9,
      }))
  );
}

export async function getLocalSolarSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const localPages = [
    ...BRAZIL_STATE_SOLAR_PAGES.map((page) => ({
      href: page.href,
      endpoint: `local_solar_pages/${page.state.toLowerCase()}`,
      priority: 0.7,
    })),
    ...BRAZIL_CAPITAL_SOLAR_PAGES.map((page) => ({
      href: page.href,
      endpoint: `local_solar_pages/${page.state.toLowerCase()}/${page.citySlug}`,
      priority: 0.72,
    })),
  ];

  const checks: Array<SitemapEntry | null> = [];
  for (let i = 0; i < localPages.length; i += 5) {
    const batch = localPages.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(async (page) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);

        try {
          const response = await fetch(buildApiUrl(`${page.endpoint}?page=1&per_page=1`), {
            next: { revalidate: 3600 },
            signal: controller.signal,
          });
          if (!response.ok) return null;

          const payload = await response.json();
          if (!isLocalPageIndexable(payload)) {
            return null;
          }

          return {
            url: absoluteUrl(page.href),
            lastModified: STATIC_SITEMAP_LAST_MODIFIED,
            changeFrequency: 'weekly' as const,
            priority: page.priority,
          };
        } catch {
          return null;
        } finally {
          clearTimeout(timeout);
        }
      })
    );
    checks.push(...batchResults);
  }

  return normalizeSitemapEntries(checks.filter((entry): entry is SitemapEntry => Boolean(entry)));
}

export async function getCreatorSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const creators = await fetchRecords('creators?per_page=100');
  const entries = await Promise.all(creators.flatMap((creator) => {
    const slug = getString(creator, 'public_slug');
    if (!slug || creator.creator_enabled !== true) return [];
    return [fetchRecords(`creators/${encodeURIComponent(slug)}/publications`, 1800).then((publications) => [
      { url: absoluteUrl(`/creators/${slug}`), priority: 0.7, changeFrequency: 'weekly' as const },
      ...publications.flatMap((publication) => {
        const postSlug = getString(publication, 'slug');
        if (!postSlug) return [];
        return [{ url: absoluteUrl(`/creators/${slug}/posts/${postSlug}`), priority: 0.6, changeFrequency: 'weekly' as const }];
      }),
    ])];
  }));
  return normalizeSitemapEntries(entries.flat());
}


export async function getSitemapEntriesBySection(
  section: SitemapSection
): Promise<MetadataRoute.Sitemap> {
  switch (section) {
    case 'static':
      return getStaticSitemapEntries();
    case 'blog':
      return getBlogSitemapEntries();
    case 'categories':
      return getCategorySitemapEntries();
    case 'company-categories':
      return getCompanyCategorySitemapEntries();
    case 'local-rankings':
      return getLocalRankingSitemapEntries();
    case 'companies':
      return getCompanySitemapEntries();
    case 'local-solar':
      return getLocalSolarSitemapEntries();
    case 'creators':
      return getCreatorSitemapEntries();
  }
}

export async function getAllSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const sections = await Promise.all(SITEMAP_SECTIONS.map(getSitemapEntriesBySection));
  return normalizeSitemapEntries(sections.flat());
}

export const getSitemapIndexEntries = () =>
  SITEMAP_SECTIONS.map((section) => ({
    loc: `${SITE.url}/sitemaps/${section}/sitemap.xml`,
    lastmod: STATIC_SITEMAP_LAST_MODIFIED,
  }));

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const normalizeLastModified = (value: SitemapEntry['lastModified']) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export function serializeSitemapUrlset(entries: MetadataRoute.Sitemap) {
  const urls = normalizeSitemapEntries(entries)
    .map((entry) => {
      const lastModified = normalizeLastModified(entry.lastModified);
      return [
        '  <url>',
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `    <lastmod>${escapeXml(lastModified)}</lastmod>` : '',
        entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : '',
        entry.priority !== undefined ? `    <priority>${entry.priority.toFixed(2)}</priority>` : '',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function serializeSitemapIndex() {
  const sitemaps = getSitemapIndexEntries()
    .map(
      (entry) =>
        `  <sitemap>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${escapeXml(
          entry.lastmod
        )}</lastmod>\n  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`;
}
