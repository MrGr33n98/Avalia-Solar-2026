import { NextResponse } from 'next/server';

import { getHomeFallbackCacheMetrics } from '@/lib/server/home-fallback-cache';

export async function GET() {
  const metrics = await getHomeFallbackCacheMetrics();
  return NextResponse.json(
    {
      status: 'ok',
      cache: metrics,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
