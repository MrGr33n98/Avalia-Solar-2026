import { buildApiUrl, getApiRequestHeaders } from './api-config';
import { ApiError } from './api-error';
import { refreshAuthSession } from './api';

type BannerRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | Record<string, unknown> | null;
  params?: Record<string, string | number | boolean | null | undefined>;
  timeout?: number;
};

export async function fetchBannerApi<T = unknown>(
  endpoint: string,
  options: BannerRequestOptions = {},
  hasRetried = false
): Promise<T> {
  const url = new URL(
    buildApiUrl(endpoint),
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  );
  Object.entries(options.params || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
  });

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = getApiRequestHeaders(
    isFormData || options.body == null ? {} : { 'Content-Type': 'application/json' }
  );
  Object.assign(headers, options.headers || {});
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 30_000);

  try {
    const response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body:
        options.body == null
          ? undefined
          : isFormData || typeof options.body === 'string'
            ? (options.body as BodyInit)
            : JSON.stringify(options.body),
      credentials: 'include',
      signal: controller.signal,
    });

    if (response.status === 401 && !hasRetried) {
      const refreshed = await refreshAuthSession();
      if (refreshed) {
      return fetchBannerApi<T>(endpoint, options, true);
      }
    }

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;
    if (!response.ok) {
      throw new ApiError(data?.message || data?.error || 'Erro HTTP ' + response.status, {
        status: response.status,
        url: url.toString(),
        method: options.method || 'GET',
        details: data,
      });
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Falha de rede', {
      url: url.toString(),
      method: options.method || 'GET',
      isNetworkError: true,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
