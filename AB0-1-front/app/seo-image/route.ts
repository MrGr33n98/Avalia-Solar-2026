import { type NextRequest } from 'next/server';

import { isProxyableSeoImageUrl } from '@/lib/seo/crawlable-image';

export const runtime = 'nodejs';

const IMAGE_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src');

  if (!src) {
    return new Response('Missing src', { status: 400 });
  }

  if (!isProxyableSeoImageUrl(src)) {
    return new Response('Image source is not allowed', { status: 403 });
  }

  try {
    const upstream = await fetch(src, {
      redirect: 'follow',
      next: { revalidate: 86_400 },
      headers: {
        Accept: 'image/avif,image/webp,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new Response('Image upstream error', { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return new Response('Upstream response is not an image', { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': IMAGE_CACHE_CONTROL,
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch {
    return new Response('Image proxy failed', { status: 502 });
  }
}
