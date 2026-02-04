export type ApiErrorOptions = {
  status?: number;
  code?: string;
  url?: string;
  method?: string;
  details?: any;
  isNetworkError?: boolean;
  isTimeout?: boolean;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  url?: string;
  method?: string;
  details?: any;
  isNetworkError?: boolean;
  isTimeout?: boolean;

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
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const toApiError = (error: unknown, fallback: ApiErrorOptions = {}) => {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : 'Erro desconhecido na API';
  return new ApiError(message, fallback);
};

export const getApiErrorMessage = (error: unknown, fallback = 'Erro ao comunicar com o servidor.') => {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
