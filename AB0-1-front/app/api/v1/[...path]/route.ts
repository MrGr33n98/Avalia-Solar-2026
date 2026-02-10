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
const UPSTREAM_FORWARDED_HEADERS = [
  'forwarded',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-forwarded-for',
  'x-real-ip',
];
const RETRYABLE_UPSTREAM_STATUSES = new Set([502, 503, 504]);

type RouteContext = {
  params: {
    path?: string[];
  };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeApiBase(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /\/api\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}

function resolveProxyApiBases() {
  const candidates = [
    process.env.API_URL_INTERNAL,
    process.env.API_PROXY_TARGET,
    process.env.NODE_ENV === 'production' ? 'http://ab0-backend:3001/api/v1' : '',
    getApiBaseUrl(),
    process.env.NEXT_PUBLIC_BROWSER_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NODE_ENV === 'production' ? 'https://api.avaliasolar.com.br/api/v1' : '',
  ];

  const resolved: string[] = [];
  const seen = new Set<string>();

  candidates.forEach((candidate) => {
    if (!candidate) return;
    const normalized = normalizeApiBase(candidate);
    if (!normalized) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    resolved.push(normalized);
  });

  return resolved;
}

function buildUpstreamUrl(baseUrl: string, pathSegments: string[], search: string) {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${baseUrl}/${encodedPath}${search}`;
}

function buildUpstreamHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedPort = request.headers.get('x-forwarded-port');
  const forwardedProto =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '') ||
    'https';

  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  UPSTREAM_FORWARDED_HEADERS.forEach((header) => headers.delete(header));

  const defaults = getApiRequestHeaders();
  Object.entries(defaults).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  // Preserve client forwarding metadata so backend rate-limit/security rules
  // can evaluate real visitors instead of the frontend container IP.
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  if (realIp) headers.set('x-real-ip', realIp);
  if (forwardedHost) headers.set('x-forwarded-host', forwardedHost);
  if (forwardedPort) headers.set('x-forwarded-port', forwardedPort);
  if (forwardedProto) headers.set('x-forwarded-proto', forwardedProto);

  return headers;
}

function isJsonContentType(contentType: string) {
  return (
    contentType.includes('application/json') ||
    contentType.includes('application/problem+json') ||
    contentType.includes('+json')
  );
}

function isPublicGetEndpoint(pathSegments: string[]) {
  const firstSegment = (pathSegments[0] || '').toLowerCase();
  return firstSegment === 'categories' || firstSegment === 'banners';
}

function shouldRetryWithFallback(upstreamResponse: Response, method: string, pathSegments: string[]) {
  if (RETRYABLE_UPSTREAM_STATUSES.has(upstreamResponse.status)) {
    return true;
  }

  if (upstreamResponse.status !== 403) {
    return false;
  }

  // Public home data endpoints are safe to retry across fallback upstreams.
  if (method === 'GET' && isPublicGetEndpoint(pathSegments)) {
    return true;
  }

  const contentType = (upstreamResponse.headers.get('content-type') || '').toLowerCase();

  // Business/security 403s from API come as JSON and should be returned as-is.
  // Non-JSON 403s are usually infra blocks (host/proxy/waf), so try next upstream.
  return !isJsonContentType(contentType);
}

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const pathSegments = context.params.path ?? [];
  const upstreamBases = resolveProxyApiBases();
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

  let lastError: unknown;

  for (let index = 0; index < upstreamBases.length; index += 1) {
    const upstreamBase = upstreamBases[index];
    const upstreamUrl = buildUpstreamUrl(upstreamBase, pathSegments, request.nextUrl.search);
    const hasFallback = index < upstreamBases.length - 1;

    try {
      const upstreamResponse = await fetch(upstreamUrl, init);

      if (hasFallback && shouldRetryWithFallback(upstreamResponse, method, pathSegments)) {
        continue;
      }

      const responseHeaders = new Headers(upstreamResponse.headers);
      HOP_BY_HOP_RESPONSE_HEADERS.forEach((header) => responseHeaders.delete(header));

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      lastError = error;
      if (hasFallback) {
        continue;
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'Upstream request failed';
  return new Response(JSON.stringify({ error: message }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });
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
