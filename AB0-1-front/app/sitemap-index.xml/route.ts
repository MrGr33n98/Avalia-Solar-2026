import {
  serializeSitemapIndex,
} from '@/lib/seo/sitemap-builders';

export const revalidate = 3600;

export async function GET() {
  return new Response(serializeSitemapIndex(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
