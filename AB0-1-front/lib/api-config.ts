const API_VERSION_PATH = '/api/v1';

type ApiRuntimeConfig = {
  baseUrl: string;
  origin: string;
  isInternal: boolean;
  isServer: boolean;
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeOrigin = (rawBase: string) => {
  const trimmed = stripTrailingSlash((rawBase || '').trim());
  if (!trimmed) {
    return '';
  }
  return trimmed.replace(/\/api\/v1\/?$/i, '');
};

export const getApiRuntimeConfig = (): ApiRuntimeConfig => {
  const isServer = typeof window === 'undefined';
  const internalBase = isServer ? process.env.API_URL_INTERNAL : '';
  const publicBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

  const rawBase = internalBase || publicBase;
  const origin = normalizeOrigin(rawBase);

  return {
    origin,
    baseUrl: `${origin}${API_VERSION_PATH}`,
    isInternal: Boolean(internalBase) && isServer,
    isServer,
  };
};

export const getApiBaseUrl = () => getApiRuntimeConfig().baseUrl;

export const getApiOrigin = () => getApiRuntimeConfig().origin;

export const buildApiUrl = (endpoint: string) => {
  const baseUrl = stripTrailingSlash(getApiBaseUrl());
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${baseUrl}/${cleanEndpoint}`;
};

export const getApiRequestHeaders = (extraHeaders: Record<string, string> = {}) => {
  const { isInternal, isServer } = getApiRuntimeConfig();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (isServer && isInternal) {
    headers['X-Forwarded-Proto'] = 'https';
  }

  return headers;
};
