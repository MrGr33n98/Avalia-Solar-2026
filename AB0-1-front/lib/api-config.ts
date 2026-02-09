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
  // Remove /api/v1 from the end of the string, recursively if necessary
  let result = trimmed;
  while (result.toLowerCase().endsWith('/api/v1')) {
    result = result.substring(0, result.length - 7);
    result = stripTrailingSlash(result);
  }
  return result;
};

export const getApiRuntimeConfig = (): ApiRuntimeConfig => {
  const isServer = typeof window === 'undefined';
  const internalBase = isServer ? process.env.API_URL_INTERNAL : '';
  const defaultPublicBase =
    process.env.NODE_ENV === 'production'
      ? 'https://api.avaliasolar.com.br'
      : 'http://localhost:3001';
  const publicBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    defaultPublicBase;

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
  // Remove leading slashes and trailing punctuation (colons, dots, commas) that might cause 404
  let cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/[:.,]+$/, '');
  
  // Se o endpoint já começar com api/v1, removemos para evitar duplicação
  if (cleanEndpoint.toLowerCase().startsWith('api/v1/')) {
    cleanEndpoint = cleanEndpoint.substring(7);
  } else if (cleanEndpoint.toLowerCase() === 'api/v1') {
    cleanEndpoint = '';
  }
  
  return cleanEndpoint ? `${baseUrl}/${cleanEndpoint}` : baseUrl;
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
