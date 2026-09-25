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

type RouteContext = {
  params: {
    path?: string[];
  };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveProxyTrackingBases() {
  const baseCandidates = [
    process.env.API_URL_INTERNAL,
    process.env.API_PROXY_TARGET,
    process.env.NODE_ENV === 'production' ? 'http://ab0-backend:3001' : '',
    getApiBaseUrl(),
    process.env.NEXT_PUBLIC_BROWSER_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://localhost:3001',
    'https://api.avaliasolar.com.br',
  ];

  const resolved: string[] = [];
  const seen = new Set<string>();

  baseCandidates.forEach((candidate) => {
    if (!candidate) return;
    let base = candidate.trim().replace(/\/+$/, '');
    base = base.replace(/\/api\/v1$/i, '');
    if (!base || !base.startsWith('http')) return;
    const trackingBase = `${base}/t`;
    if (seen.has(trackingBase)) return;
    seen.add(trackingBase);
    resolved.push(trackingBase);
  });

  return resolved;
}

function buildUpstreamUrl(baseUrl: string, pathSegments: string[], search: string) {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${baseUrl}/${encodedPath}${search}`;
}

function buildUpstreamHeaders(request: NextRequest, bodyLength?: number) {
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

  if (typeof bodyLength === 'number' && bodyLength >= 0) {
    headers.set('content-length', bodyLength.toString());
  }

  const defaults = getApiRequestHeaders();
  Object.entries(defaults).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  if (realIp) headers.set('x-real-ip', realIp);
  if (forwardedHost) headers.set('x-forwarded-host', forwardedHost);
  if (forwardedPort) headers.set('x-forwarded-port', forwardedPort);
  if (forwardedProto) headers.set('x-forwarded-proto', forwardedProto);

  return headers;
}

async function proxyTrackingRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const pathSegments = context.params.path ?? [];
  const upstreamBases = resolveProxyTrackingBases();
  const method = request.method.toUpperCase();
  const requestBody =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  let lastError: unknown;

  for (let index = 0; index < upstreamBases.length; index += 1) {
    const upstreamBase = upstreamBases[index];
    const upstreamUrl = buildUpstreamUrl(upstreamBase, pathSegments, request.nextUrl.search);
    const hasFallback = index < upstreamBases.length - 1;

    try {
      const init: RequestInit & { duplex?: 'half' } = {
        method,
        headers: buildUpstreamHeaders(request, requestBody?.byteLength),
        cache: 'no-store',
        redirect: 'manual',
      };

      if (requestBody) {
        init.body = requestBody.slice(0);
        init.duplex = 'half';
      }

      const upstreamResponse = await fetch(upstreamUrl, init);

      if (hasFallback && upstreamResponse.status >= 500) {
        try {
          await upstreamResponse.body?.cancel();
        } catch {}
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

  const message = lastError instanceof Error ? lastError.message : 'Tracking upstream request failed';
  return new Response(JSON.stringify({ error: message }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyTrackingRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyTrackingRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyTrackingRequest(request, context);
}
