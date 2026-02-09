import { NextRequest } from 'next/server';

import { getApiBaseUrl, getApiRequestHeaders } from '@/lib/api-config';

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

type RouteContext = {
  params: {
    path?: string[];
  };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildUpstreamUrl(pathSegments: string[], search: string) {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${baseUrl}/${encodedPath}${search}`;
}

function buildUpstreamHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const defaults = getApiRequestHeaders();
  Object.entries(defaults).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const pathSegments = context.params.path ?? [];
  const upstreamUrl = buildUpstreamUrl(pathSegments, request.nextUrl.search);
  const method = request.method.toUpperCase();

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers: buildUpstreamHeaders(request),
    cache: 'no-store',
    redirect: 'manual',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, init);
    const responseHeaders = new Headers(upstreamResponse.headers);
    HOP_BY_HOP_RESPONSE_HEADERS.forEach((header) => responseHeaders.delete(header));

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream request failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
