import { MetadataRoute } from 'next';
import { buildApiUrl } from '@/lib/api-config';

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
      const { data } = await res.json();
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

  return [...routes, ...blogRoutes];
}