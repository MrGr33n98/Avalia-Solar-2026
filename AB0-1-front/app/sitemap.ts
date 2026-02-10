import { MetadataRoute } from 'next';
import { buildApiUrl } from '@/lib/api-config';
import { buildCategorySegment } from '@/lib/seo/companies-category-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL
  const baseUrl = 'https://www.avaliasolar.com.br';

  // Static routes
  const routes = [
    '',
    '/blog',
    '/login',
    '/register',
    '/companies',
    '/products',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
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
        lastModified: post.updated_at || new Date().toISOString(),
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
        lastModified: cat.updated_at || new Date().toISOString(),
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
          lastModified: cat.updated_at || new Date().toISOString(),
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
        lastModified: company.updated_at || new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error('Failed to generate companies sitemap:', error);
  }

  return [...routes, ...blogRoutes, ...categoryRoutes, ...companyCategoryRoutes, ...companyRoutes];
}
