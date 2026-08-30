import { NextResponse } from 'next/server';
import { getApiRuntimeConfig } from '@/lib/api-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET() {
  const apiConfig = getApiRuntimeConfig();

  return NextResponse.json(
    {
      status: 'ok',
      release: process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      timestamp: new Date().toISOString(),
      diagnostics: {
        isServer: apiConfig.isServer,
        isInternal: apiConfig.isInternal,
        apiOrigin: apiConfig.origin,
        apiBaseUrl: apiConfig.baseUrl,
        env: {
          NODE_ENV: process.env.NODE_ENV ? 'defined' : 'undefined',
          API_URL_INTERNAL: process.env.API_URL_INTERNAL ? 'defined' : 'undefined',
          API_PROXY_TARGET: process.env.API_PROXY_TARGET ? 'defined' : 'undefined',
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ? 'defined' : 'undefined',
        },
      },
    },
    {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
    }
  );
}
