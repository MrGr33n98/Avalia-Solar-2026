import { MetadataRoute } from 'next';
import { buildApiUrl } from '@/lib/api-config';
import { BRAZIL_CAPITAL_SOLAR_PAGES, BRAZIL_STATE_SOLAR_PAGES } from '@/lib/locations/local-page-slugs';
import { buildCategorySegment } from '@/lib/seo/companies-category-url';
import { SITE, STATIC_SITEMAP_LAST_MODIFIED } from '@/lib/site';
import { SEO_CITIES } from '@/lib/constants/seo-cities';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE.url;

  const routes = [
    { route: '', priority: 1, changeFrequency: 'daily' as const },
    { route: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/companies', priority: 0.9, changeFrequency: 'daily' as const },
    { route: '/products', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/about', priority: 0.65, changeFrequency: 'monthly' as const },
    { route: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/help', priority: 0.65, changeFrequency: 'monthly' as const },
    { route: '/press', priority: 0.55, changeFrequency: 'monthly' as const },
    { route: '/careers', priority: 0.55, changeFrequency: 'monthly' as const },
    { route: '/privacy', priority: 0.45, changeFrequency: 'yearly' as const },
    { route: '/terms', priority: 0.45, changeFrequency: 'yearly' as const },
    { route: '/cookies', priority: 0.4, changeFrequency: 'yearly' as const },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: STATIC_SITEMAP_LAST_MODIFIED,
    changeFrequency,
    priority,
  }));

  // Dynamic Blog Posts
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(buildApiUrl('articles?per_page=100'), { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      
      // Valida cada post individualmente para garantir que o endpoint de detalhe de fato responde OK (evita 404s no sitemap)
      const validPosts = await Promise.all(
        data.map(async (post: any) => {
          try {
            const detailRes = await fetch(buildApiUrl(`articles/${post.slug}`), { method: 'GET' });
            if (detailRes.ok) {
              return post;
            }
          } catch (e) {
            // Ignora erro
          }
          return null;
        })
      );

      blogRoutes = validPosts
        .filter(Boolean)
        .map((post: any) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post.updated_at || STATIC_SITEMAP_LAST_MODIFIED,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error('Failed to generate blog sitemap:', error);
  }

  // Dynamic Categories and Local Rankings
  let categoryRoutes: MetadataRoute.Sitemap = [];
  let companyCategoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(buildApiUrl('categories?per_page=100'), { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      categoryRoutes = data.map((cat: any) => ({
        url: `${baseUrl}/categories/${cat.seo_url}`,
        lastModified: cat.updated_at || STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      companyCategoryRoutes = data
        .filter((cat: any) => Number(cat.companies_count || 0) > 0)
        .map((cat: any) => ({
          url: `${baseUrl}/companies/categorias/${buildCategorySegment({
            id: Number(cat.id),
            name: cat.name,
            seo_url: cat.seo_url,
          })}`,
          lastModified: cat.updated_at || STATIC_SITEMAP_LAST_MODIFIED,
          changeFrequency: 'weekly' as const,
          priority: 0.75,
        }));
    }
  } catch (error) {
    console.error('Failed to generate categories sitemap:', error);
  }

  // Dynamic Local Rankings (Filtered by Rule of 3 Companies)
  let localRankingRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(buildApiUrl('sitemaps/local_rankings'), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000), // timeout of 10s
    });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || [];
      localRankingRoutes = data.map((item: any) => ({
        url: `${baseUrl}/melhores-empresas/${item.category_slug}/${item.state}/${item.city_slug}`,
        lastModified: item.updated_at || STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Failed to generate local rankings sitemap:', error);
  }

  // Dynamic Companies
  let companyRoutes: MetadataRoute.Sitemap = [];
  try {
    // Fetch active companies. We might need to handle pagination if there are many.
    const res = await fetch(buildApiUrl('companies?status=active&per_page=100'), { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      companyRoutes = data.map((company: any) => ({
        url: `${baseUrl}/companies/${company.slug}`,
        lastModified: company.updated_at || STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error('Failed to generate companies sitemap:', error);
  }

  // Local SEO pages: include only state/city pages with strict eligible companies.
  let localSolarRoutes: MetadataRoute.Sitemap = [];
  try {
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

    const checks: any[] = [];
    for (let i = 0; i < localPages.length; i += 5) {
      const batch = localPages.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (page) => {
          try {
            const res = await fetch(buildApiUrl(`${page.endpoint}?page=1&per_page=1`), { next: { revalidate: 3600 } });
            if (!res.ok) return null;

            const json = await res.json();
            if (json?.seo?.indexable !== true) return null;

            return {
              url: `${baseUrl}${page.href}`,
              lastModified: STATIC_SITEMAP_LAST_MODIFIED,
              changeFrequency: 'weekly' as const,
              priority: page.priority,
            };
          } catch (e) {
            console.error(`Failed to fetch local sitemap page ${page.endpoint}`, e);
            return null;
          }
        })
      );
      checks.push(...batchResults);
    }

    localSolarRoutes = checks.filter(Boolean) as MetadataRoute.Sitemap;
  } catch (error) {
    console.error('Failed to generate local solar sitemap:', error);
  }

  return [
    ...routes,
    ...blogRoutes,
    ...categoryRoutes,
    ...companyCategoryRoutes,
    ...localRankingRoutes,
    ...companyRoutes,
    ...localSolarRoutes,
  ];
}
