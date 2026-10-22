export type ApiErrorOptions = {
  status?: number;
  code?: string;
  url?: string;
  method?: string;
  details?: unknown;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  requestId?: string;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  url?: string;
  method?: string;
  details?: unknown;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  requestId?: string;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.url = options.url;
    this.method = options.method;
    this.details = options.details;
    this.isNetworkError = options.isNetworkError;
    this.isTimeout = options.isTimeout;
    this.requestId = options.requestId;
  }
}

export const isAbortError = (error: unknown): boolean => {
  if (!error) return false;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error) {
    if (error.name === 'AbortError') return true;
    const msg = error.message.toLowerCase();
    if (msg.includes('aborted') || msg.includes('user aborted') || msg.includes('abort')) return true;
  }
  return false;
};

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const toApiError = (error: unknown, fallback: ApiErrorOptions = {}) => {
  if (error instanceof ApiError) return error;
  const isAborted = isAbortError(error);
  const message = error instanceof Error ? error.message : 'Erro desconhecido na API';
  return new ApiError(message, {
    ...fallback,
    isTimeout: fallback.isTimeout || (error instanceof Error && error.message.includes('timeout')),
    isNetworkError: fallback.isNetworkError || (error instanceof TypeError),
    details: fallback.details ?? (isAborted ? { aborted: true } : undefined),
  });
};

export const getApiErrorMessage = (error: unknown, fallback = 'Erro ao comunicar com o servidor.') => {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null) {
    const payload = error as { error?: unknown; message?: unknown };
    if (typeof payload.message === 'string' && payload.message) return payload.message;
    if (typeof payload.error === 'object' && payload.error !== null) {
      const nested = payload.error as { message?: unknown };
      if (typeof nested.message === 'string' && nested.message) return nested.message;
    }
    if (typeof payload.error === 'string' && payload.error) return payload.error;
  }
  return fallback;
};
