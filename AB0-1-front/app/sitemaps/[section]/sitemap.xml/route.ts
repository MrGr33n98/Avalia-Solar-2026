import {
  getSitemapEntriesBySection,
  serializeSitemapUrlset,
  SITEMAP_SECTIONS,
  type SitemapSection,
} from '@/lib/seo/sitemap-builders';

export const revalidate = 3600;

const isSitemapSection = (section: string): section is SitemapSection =>
  SITEMAP_SECTIONS.includes(section as SitemapSection);

export async function GET(
  _request: Request,
  { params }: { params: { section: string } }
) {
  if (!isSitemapSection(params.section)) {
    return new Response('Not found', { status: 404 });
  }

  const entries = await getSitemapEntriesBySection(params.section);

  return new Response(serializeSitemapUrlset(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
