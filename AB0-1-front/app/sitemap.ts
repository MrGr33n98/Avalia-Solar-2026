import { MetadataRoute } from 'next';
import { buildApiUrl } from '@/lib/api-config';
import { BRAZIL_CAPITAL_SOLAR_PAGES } from '@/lib/locations/local-page-slugs';
import { buildCategorySegment } from '@/lib/seo/companies-category-url';
import { SITE, STATIC_SITEMAP_LAST_MODIFIED } from '@/lib/site';

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
      blogRoutes = data.map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at || STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Failed to generate blog sitemap:', error);
  }

  // Dynamic Categories
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

  // Local SEO pages: include only capitals with at least one active matching company.
  let localSolarRoutes: MetadataRoute.Sitemap = [];
  try {
    const checks = await Promise.all(
      BRAZIL_CAPITAL_SOLAR_PAGES.map(async (page) => {
        const params = new URLSearchParams({
          status: 'active',
          serves_state: page.state,
          serves_city: page.city,
          page: '1',
          per_page: '1',
          fields: 'card',
        });
        const res = await fetch(buildApiUrl(`companies?${params.toString()}`), { next: { revalidate: 3600 } });
        if (!res.ok) return null;

        const json = await res.json();
        const total = Number(json?.meta?.pagination?.total ?? json?.data?.length ?? 0);
        if (!Number.isFinite(total) || total <= 0) return null;

        return {
          url: `${baseUrl}${page.href}`,
          lastModified: STATIC_SITEMAP_LAST_MODIFIED,
          changeFrequency: 'weekly' as const,
          priority: 0.72,
        };
      })
    );

    localSolarRoutes = checks.filter(Boolean) as MetadataRoute.Sitemap;
  } catch (error) {
    console.error('Failed to generate local solar sitemap:', error);
  }

  return [...routes, ...blogRoutes, ...categoryRoutes, ...companyCategoryRoutes, ...companyRoutes, ...localSolarRoutes];
}
