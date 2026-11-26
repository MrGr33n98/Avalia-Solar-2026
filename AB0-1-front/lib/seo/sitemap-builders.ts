import { CREATOR_EXPERIENCE_ENABLED } from '@/lib/mvp-reviews';
import type { MetadataRoute } from 'next';

import { buildApiUrl } from '@/lib/api-config';
import {
  BRAZIL_CAPITAL_SOLAR_PAGES,
  BRAZIL_STATE_SOLAR_PAGES,
} from '@/lib/locations/local-page-slugs';
import { buildCategorySegment } from '@/lib/seo/companies-category-url';
import { CAPITAL_COVERAGE_REPORT } from '@/lib/seo/sector-reports';
import { TRUST_PAGES } from '@/lib/seo/trust-pages';
import { SITE, STATIC_SITEMAP_LAST_MODIFIED, absoluteUrl } from '@/lib/site';
import { buildCompanyPath } from '@/lib/slug';

export const SITEMAP_SECTIONS = [
  'static',
  'blog',
  'categories',
  'company-categories',
  'local-rankings',
  'companies',
  'services',
  'local-solar',
  'creators',
  'groups',
] as const;

export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

type ApiRecord = Record<string, unknown>;

type SitemapEntry = MetadataRoute.Sitemap[number];

const SITEMAP_FETCH_TIMEOUT_MS = 6_000;
const MAX_URLS_PER_SITEMAP = 50_000;
const CATEGORY_SITEMAP_PAGE_SIZE = 200;
const CATEGORY_SITEMAP_MAX_PAGES = 250;
const COMPANY_SITEMAP_PAGE_SIZE = 100;
const PAGINATED_SITEMAP_MAX_PAGES = 500;

export class SitemapUpstreamError extends Error {
  public readonly section: string;
  public readonly httpStatus?: number;

  constructor(section: string, message: string, httpStatus?: number) {
    super(message);
    this.name = 'SitemapUpstreamError';
    this.section = section;
    this.httpStatus = httpStatus;
  }
}
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

const getNumber = (record: ApiRecord | undefined, key: string) => {
  if (!record || record[key] === null || record[key] === undefined || record[key] === '') {
    return undefined;
  }

  const value = Number(record[key]);
  return Number.isFinite(value) ? value : undefined;
};

const unwrapData = (payload: unknown): ApiRecord[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  const data = payload.data;
  return Array.isArray(data) ? data.filter(isRecord) : [];
};

const recordsFromPayload = (payload: unknown, section: string): ApiRecord[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }

  throw new SitemapUpstreamError(
    section,
    'Payload incompatível: esperada uma lista de registros no campo data',
    503
  );
};

const sectionFromEndpoint = (endpoint: string) => endpoint.split(/[/?]/, 1)[0] || 'unknown';

const appendQuery = (endpoint: string, params: Record<string, string | number>) => {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  );
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query.toString()}`;
};

const normalizeSitemapEntries = (entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap => {
  const seen = new Set<string>();
  const normalized: MetadataRoute.Sitemap = [];

  for (const entry of entries) {
    if (normalized.length >= MAX_URLS_PER_SITEMAP) break;

    try {
      const parsed = new URL(entry.url);
      parsed.hash = '';
      parsed.search = '';
      const path = parsed.pathname.replace(/\/+$/, '') || '/';
      parsed.pathname = path;

      if (PRIVATE_OR_ACTION_PATH_PATTERNS.some((pattern) => pattern.test(path))) continue;

      const url = parsed.toString();
      if (seen.has(url)) continue;
      seen.add(url);
      normalized.push({ ...entry, url });
    } catch {
      // Drop malformed sitemap entries instead of emitting invalid XML.
    }
  }

  return normalized;
};

async function fetchRecords(endpoint: string, revalidate = 3600): Promise<ApiRecord[]> {
  const section = sectionFromEndpoint(endpoint);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(buildApiUrl(endpoint), {
      next: { revalidate },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new SitemapUpstreamError(
        section,
        `Falha no feed de sitemap (HTTP ${response.status})`,
        response.status || 503
      );
    }

    return recordsFromPayload(await response.json(), section);
  } catch (error) {
    if (error instanceof SitemapUpstreamError) throw error;

    console.error(`[Sitemap][${section}] Network/timeout failure:`, error);
    throw new SitemapUpstreamError(
      section,
      'Falha de comunicação ou timeout ao exportar sitemap',
      503
    );
  } finally {
    clearTimeout(timeout);
  }
}

type RecordsPage = {
  records: ApiRecord[];
  totalPages?: number;
  nextPage?: number;
};

async function fetchRecordsPage(
  endpoint: string,
  page: number,
  pageSize: number,
  revalidate = 3600
): Promise<RecordsPage> {
  const section = sectionFromEndpoint(endpoint);
  const query = appendQuery(endpoint, { page, per_page: pageSize });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(buildApiUrl(query), {
      next: { revalidate },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new SitemapUpstreamError(
        section,
        `Falha no feed paginado de sitemap (HTTP ${response.status})`,
        response.status || 503
      );
    }

    const payload = (await response.json()) as unknown;
    const records = recordsFromPayload(payload, section);
    const meta = isRecord(payload) && isRecord(payload.meta) ? payload.meta : undefined;
    const pagination = meta && isRecord(meta.pagination) ? meta.pagination : undefined;
    const totalPages = getNumber(pagination, 'total_pages');
    const nextPage = getNumber(pagination, 'next_page');

    return { records, totalPages, nextPage };
  } catch (error) {
    if (error instanceof SitemapUpstreamError) throw error;

    console.error(`[Sitemap][${section}] Paginated network/timeout failure:`, error);
    throw new SitemapUpstreamError(
      section,
      'Falha de comunicação ou timeout ao exportar sitemap paginado',
      503
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaginatedRecords(
  endpoint: string,
  pageSize: number,
  revalidate = 3600
): Promise<ApiRecord[]> {
  const records: ApiRecord[] = [];

  for (let page = 1; page <= PAGINATED_SITEMAP_MAX_PAGES; page += 1) {
    const result = await fetchRecordsPage(endpoint, page, pageSize, revalidate);
    records.push(...result.records);

    const hasMoreByMetadata = result.nextPage !== undefined && result.nextPage > page;
    const hasMoreBySize = result.totalPages === undefined && result.records.length >= pageSize;
    const hasMore =
      result.totalPages !== undefined
        ? page < result.totalPages
        : hasMoreByMetadata || hasMoreBySize;

    if (!hasMore) return records;
  }

  throw new SitemapUpstreamError(
    sectionFromEndpoint(endpoint),
    `Paginação excedeu o limite seguro de ${PAGINATED_SITEMAP_MAX_PAGES} páginas`,
    503
  );
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

const isEligibleCategorySitemapRecord = (record: ApiRecord): boolean => {
  const status = getString(record, 'status');
  if (status && status !== 'active') return false;

  if (record.include_in_sitemap === false) return false;

  const indexability = isRecord(record.indexability) ? record.indexability : null;
  if (indexability && indexability.include_in_sitemap === false) return false;

  const slug = getString(record, 'slug') || getString(record, 'seo_url');
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;

  return true;
};

async function fetchCategorySitemapFeed(revalidate = 3600): Promise<ApiRecord[]> {
  const records: ApiRecord[] = [];
  let cursor: number | null = null;

  for (let page = 1; page <= CATEGORY_SITEMAP_MAX_PAGES; page += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);
    const query = cursor
      ? `sitemaps/categories?limit=${CATEGORY_SITEMAP_PAGE_SIZE}&cursor=${cursor}`
      : `sitemaps/categories?limit=${CATEGORY_SITEMAP_PAGE_SIZE}`;

    try {
      const response = await fetch(buildApiUrl(query), {
        next: { revalidate, tags: ['categories', 'sitemap-categories'] },
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(`[Sitemap][categories] Upstream HTTP ${response.status} on ${query}`);
        throw new SitemapUpstreamError(
          'categories',
          `Falha no feed de sitemap de categorias (HTTP ${response.status})`,
          response.status
        );
      }

      const payload = (await response.json()) as unknown;
      const batch = unwrapData(payload);
      records.push(...batch.filter(isEligibleCategorySitemapRecord));

      const meta = isRecord(payload) && isRecord(payload.meta) ? payload.meta : null;
      const hasMore = meta?.has_more === true;
      const nextCursor = meta ? getNumber(meta, 'next_cursor') : undefined;

      if (!hasMore || !nextCursor || nextCursor <= (cursor || 0)) {
        break;
      }

      cursor = nextCursor;
    } catch (error) {
      if (error instanceof SitemapUpstreamError) {
        throw error;
      }
      console.error('[Sitemap][categories] Network/timeout failure:', error);
      throw new SitemapUpstreamError(
        'categories',
        'Falha de comunicação ou timeout ao exportar sitemap de categorias',
        503
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  return records;
}

export async function getCategorySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const categories = await fetchCategorySitemapFeed();
  return normalizeSitemapEntries(
    categories.map((category) => {
      const slug = getString(category, 'slug') || getString(category, 'seo_url');
      const canonicalPath = getString(category, 'canonical_path') || `/categories/${slug}`;
      return {
        url: absoluteUrl(canonicalPath),
        lastModified:
          getString(category, 'lastmod') ||
          getString(category, 'updated_at') ||
          STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    })
  );
}

export async function getCompanyCategorySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const categories = await fetchCategorySitemapFeed();
  return normalizeSitemapEntries(
    categories
      .filter((category) => {
        const id = getNumber(category, 'id');
        const name = getString(category, 'name');
        const seoUrl = getString(category, 'seo_url') || getString(category, 'slug');
        const companiesCount = getNumber(category, 'companies_count') || 0;
        return Boolean(id && name && seoUrl && companiesCount > 0);
      })
      .map((category) => {
        const id = getNumber(category, 'id') as number;
        const name = getString(category, 'name') as string;
        const seoUrl = (getString(category, 'seo_url') || getString(category, 'slug')) as string;
        return {
          url: absoluteUrl(
            `/companies/categorias/${buildCategorySegment({ id, name, seo_url: seoUrl })}`
          ),
          lastModified:
            getString(category, 'lastmod') ||
            getString(category, 'updated_at') ||
            STATIC_SITEMAP_LAST_MODIFIED,
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
  const entries: MetadataRoute.Sitemap = [];
  const pageSize = 500;
  let useDedicatedFeed = true;

  try {
    for (let page = 1; page <= 50; page += 1) {
      const records = await fetchRecords(`sitemaps/companies?page=${page}&per_page=${pageSize}`, 1800);
      for (const company of records) {
        const slug = getString(company, 'slug');
        if (!slug) continue;
        entries.push({
          url: absoluteUrl(
            buildCompanyPath(
              slug,
              getString(company, 'name'),
              getNumber(company, 'id')
            )
          ),
          lastModified: getString(company, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
          changeFrequency: 'daily' as const,
          priority: 0.9,
        });
      }
      if (records.length < pageSize) break;
    }
  } catch (error) {
    console.warn('[Sitemap][companies] Dedicated feed failed, attempting fallback:', error);
    useDedicatedFeed = false;
  }

  if (!useDedicatedFeed && entries.length === 0) {
    try {
      const companies = await fetchPaginatedRecords(
        'companies?status=active',
        COMPANY_SITEMAP_PAGE_SIZE,
        900
      );
      for (const company of companies) {
        const slug = getString(company, 'slug');
        if (!slug) continue;
        entries.push({
          url: absoluteUrl(
            buildCompanyPath(
              slug,
              getString(company, 'name'),
              getNumber(company, 'id')
            )
          ),
          lastModified: getString(company, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
          changeFrequency: 'daily' as const,
          priority: 0.9,
        });
      }
    } catch (fallbackError) {
      console.error('[Sitemap][companies] Both feeds failed:', fallbackError);
      if (entries.length === 0) throw fallbackError;
    }
  }

  if (entries.length > MAX_URLS_PER_SITEMAP) {
    throw new SitemapUpstreamError(
      'companies',
      `A seção companies excede o limite de ${MAX_URLS_PER_SITEMAP} URLs; particionamento necessário`,
      503
    );
  }

  return normalizeSitemapEntries(entries);
}

/** Cada serviço ativo tem URL indexável própria, sem misturar empresas ou rascunhos. */
export async function getServiceSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const pageSize = 500;
  // Limite de segurança: um sitemap XML comporta até 50 mil URLs.
  for (let page = 1; page <= 100; page += 1) {
    const records = await fetchRecords(`sitemaps/services?page=${page}&per_page=${pageSize}`, 900);
    for (const service of records) {
      const companySlug = getString(service, 'company_slug');
      const serviceSlug = getString(service, 'service_slug');
      if (!companySlug || !serviceSlug) continue;
      entries.push({
        url: absoluteUrl(`/companies/${companySlug}/services/${serviceSlug}`),
        lastModified: getString(service, 'updated_at') || STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
    if (records.length < pageSize) break;
  }
  return normalizeSitemapEntries(entries);
}

export async function getLocalSolarSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const localPages = [
    ...BRAZIL_STATE_SOLAR_PAGES.map((page) => ({
      href: page.href,
      priority: 0.7,
    })),
    ...BRAZIL_CAPITAL_SOLAR_PAGES.map((page) => ({
      href: page.href,
      priority: 0.72,
    })),
  ];

  const records = await fetchRecords('sitemaps/local_solar_pages', 900);
  const pagesByHref = new Map(localPages.map((page) => [page.href, page]));
  const entries = records.flatMap((record) => {
    const path = getString(record, 'path');
    const page = path ? pagesByHref.get(path) : undefined;
    if (!page) return [];

    return [
      {
        url: absoluteUrl(page.href),
        lastModified: STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: getNumber(record, 'priority') ?? page.priority,
      },
    ];
  });

  return normalizeSitemapEntries(entries);
}

export async function getCreatorSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  if (!CREATOR_EXPERIENCE_ENABLED) return [];
  const creators = await fetchRecords('creators?per_page=100');
  const entries = await Promise.all(
    creators.flatMap((creator) => {
      const slug = getString(creator, 'public_slug');
      if (!slug || creator.creator_enabled !== true) return [];
      return [
        fetchRecords(`creators/${encodeURIComponent(slug)}/publications`, 1800).then(
          (publications) => [
            {
              url: absoluteUrl(`/creators/${slug}`),
              priority: 0.7,
              changeFrequency: 'weekly' as const,
            },
            ...publications.flatMap((publication) => {
              const postSlug = getString(publication, 'slug');
              if (!postSlug) return [];
              return [
                {
                  url: absoluteUrl(`/creators/${slug}/posts/${postSlug}`),
                  priority: 0.6,
                  changeFrequency: 'weekly' as const,
                },
              ];
            }),
          ]
        ),
      ];
    })
  );
  return normalizeSitemapEntries(entries.flat());
}

export async function getGroupSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const groups = await fetchRecords('groups?per_page=500');
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/groups'), priority: 0.8, changeFrequency: 'daily' as const },
  ];

  groups.forEach((group) => {
    const slug = getString(group, 'slug');
    if (!slug) return;

    const visibility = getString(group, 'visibility');
    const status = getString(group, 'status');
    const updatedAt = getString(group, 'updated_at');

    if (visibility === 'public' && status === 'active') {
      entries.push({
        url: absoluteUrl(`/groups/${slug}`),
        priority: 0.7,
        changeFrequency: 'daily' as const,
        lastModified: updatedAt ? new Date(updatedAt) : undefined,
      });
    }
  });

  const posts = await fetchRecords('sitemaps/group_posts');
  posts.forEach((post) => {
    const groupSlug = getString(post, 'group_slug');
    const postId = getNumber(post, 'post_id');
    const updatedAt = getString(post, 'updated_at');

    if (groupSlug && postId) {
      entries.push({
        url: absoluteUrl(`/groups/${groupSlug}/posts/${postId}`),
        priority: 0.6,
        changeFrequency: 'weekly' as const,
        lastModified: updatedAt ? new Date(updatedAt) : undefined,
      });
    }
  });

  return normalizeSitemapEntries(entries);
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
    case 'services':
      return getServiceSitemapEntries();
    case 'local-solar':
      return getLocalSolarSitemapEntries();
    case 'creators':
      return getCreatorSitemapEntries();
    case 'groups':
      return getGroupSitemapEntries();
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
