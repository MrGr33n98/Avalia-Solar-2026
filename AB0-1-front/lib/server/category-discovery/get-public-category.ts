import * as React from 'react';
import type { Category } from '@/lib/api';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';

const VALID_CATEGORY_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 160;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_REVALIDATE_SECONDS = 3_600;

export class CategoryUpstreamError extends Error {
  public readonly httpStatus: number;

  constructor(message: string, httpStatus = 502) {
    super(message);
    this.name = 'CategoryUpstreamError';
    this.httpStatus = httpStatus;
  }
}

export class CategoryTimeoutError extends Error {
  constructor(message = 'Tempo limite excedido ao consultar serviço de categorias') {
    super(message);
    this.name = 'CategoryTimeoutError';
  }
}

export type PublicCategoryResult =
  | { status: 'ok'; category: Category }
  | { status: 'not_found' };

export interface GetPublicCategoryOptions {
  revalidate?: number;
  timeoutMs?: number;
  retries?: number;
  tags?: string[];
}

/**
 * Normaliza e valida um slug de categoria.
 * Bloqueia path traversal (..), barras (/ ou \), caracteres codificados de barra (%2f/%5c),
 * espaços internos ou tags HTML, retornando null quando inválido.
 */
export function normalizeCategorySlug(rawSlug: string | null | undefined): string | null {
  if (typeof rawSlug !== 'string') return null;

  const trimmed = rawSlug.trim();
  if (!trimmed || trimmed.length > MAX_SLUG_LENGTH) return null;

  if (
    trimmed.includes('..') ||
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    /%2f|%5c|%00/i.test(trimmed)
  ) {
    return null;
  }

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed).trim();
  } catch {
    return null;
  }

  const normalized = decoded.toLowerCase();
  if (! normalized || normalized.length > MAX_SLUG_LENGTH) return null;
  if (!VALID_CATEGORY_SLUG_REGEX.test(normalized)) return null;

  return normalized;
}

/**
 * Busca estrita de categoria pública para rotas SSR/SEO:
 * - 200 ativo -> { status: 'ok', category }
 * - 404 ou slug inválido -> { status: 'not_found' }
 * - 5xx / erro de transporte -> lança CategoryUpstreamError
 * - timeout / AbortError -> lança CategoryTimeoutError
 */
export async function getPublicCategory(
  rawSlug: string,
  options: GetPublicCategoryOptions = {}
): Promise<PublicCategoryResult> {
  const slug = normalizeCategorySlug(rawSlug);
  if (!slug) {
    return { status: 'not_found' };
  }

  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE_SECONDS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? 0;
  const tags = Array.from(new Set(['categories', `category-${slug}`, ...(options.tags || [])]));
  const url = buildApiUrl(`categories/by_slug/${encodeURIComponent(slug)}`);

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiRequestHeaders({ Accept: 'application/json' }),
        signal: controller.signal,
        next: {
          revalidate,
          tags,
        },
      });

      if (response.status === 404) {
        return { status: 'not_found' };
      }

      if (!response.ok) {
        throw new CategoryUpstreamError(
          `Falha temporária ao carregar categoria (HTTP ${response.status})`,
          response.status
        );
      }

      const data = (await response.json()) as Category | null;
      if (!data || typeof data !== 'object') {
        return { status: 'not_found' };
      }

      if (typeof data.status === 'string' && data.status !== 'active') {
        return { status: 'not_found' };
      }

      return { status: 'ok', category: data };
    } catch (error) {
      lastError = error;

      if (error instanceof CategoryUpstreamError) {
        if (attempt < retries && error.httpStatus >= 500) {
          continue;
        }
        throw error;
      }

      if ((error as Error)?.name === 'AbortError') {
        const timeoutErr = new CategoryTimeoutError(
          `Tempo limite excedido ao consultar categoria (${timeoutMs}ms)`
        );
        if (attempt < retries) {
          lastError = timeoutErr;
          continue;
        }
        throw timeoutErr;
      }

      const transportErr = new CategoryUpstreamError(
        'Falha de comunicação com o serviço de categorias',
        503
      );
      if (attempt < retries) {
        lastError = transportErr;
        continue;
      }
      throw transportErr;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new CategoryUpstreamError('Falha ao consultar categoria', 503);
}

const inFlightBySlug = new Map<string, Promise<PublicCategoryResult>>();

async function fetchCategoryDeduplicated(
  rawSlug: string,
  revalidate = DEFAULT_REVALIDATE_SECONDS
): Promise<PublicCategoryResult> {
  const normalized = normalizeCategorySlug(rawSlug);
  if (!normalized) {
    return { status: 'not_found' };
  }

  const key = `${normalized}:${revalidate}`;
  const existing = inFlightBySlug.get(key);
  if (existing) {
    return existing;
  }

  const promise = getPublicCategory(normalized, { revalidate }).finally(() => {
    inFlightBySlug.delete(key);
  });

  inFlightBySlug.set(key, promise);
  return promise;
}

type CachedCategoryFetcher = (
  normalizedSlug: string,
  revalidate: number
) => Promise<PublicCategoryResult>;

const reactCache: (fn: CachedCategoryFetcher) => CachedCategoryFetcher =
  typeof (React as unknown as { cache?: unknown }).cache === 'function'
    ? (React as unknown as { cache: (fn: CachedCategoryFetcher) => CachedCategoryFetcher }).cache
    : (fn) => fn;

const cachedFetcher = reactCache((normalizedSlug: string, revalidate: number) =>
  fetchCategoryDeduplicated(normalizedSlug, revalidate)
);

export async function getCachedPublicCategory(
  rawSlug: string,
  options: { revalidate?: number } = {}
): Promise<PublicCategoryResult> {
  const normalized = normalizeCategorySlug(rawSlug);
  if (!normalized) {
    return { status: 'not_found' };
  }

  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE_SECONDS;
  return cachedFetcher(normalized, revalidate);
}

