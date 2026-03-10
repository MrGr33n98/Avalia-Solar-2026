import { isMobileOfflineEnabled } from './config';
import {
  flushOfflineMutationQueue,
  queueOfflineMutation,
  requestOfflineQueueSync,
} from './mutationQueue';
import type { QueuedMutationMethod } from './db';

interface OfflineMutationOptions {
  conflictKey?: string;
  metadata?: Record<string, unknown>;
}

export interface QueuedOfflineMutationResult {
  queued: true;
  offline: true;
  error?: unknown;
}

export const isQueuedOfflineMutationResult = (
  value: unknown
): value is QueuedOfflineMutationResult =>
  typeof value === 'object' &&
  value !== null &&
  'queued' in value &&
  (value as { queued?: unknown }).queued === true;

const normalizeHeaders = (headers?: HeadersInit) => {
  const normalizedHeaders: Record<string, string> = {};
  if (!headers) return normalizedHeaders;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalizedHeaders[key] = value;
    });
    return normalizedHeaders;
  }

  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      normalizedHeaders[key] = value;
    });
    return normalizedHeaders;
  }

  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    normalizedHeaders[key] = String(value);
  });

  return normalizedHeaders;
};

const canQueueMutationBody = (body: RequestInit['body']) => {
  if (body == null) return true;
  if (typeof body === 'string') return true;
  if (body instanceof URLSearchParams) return true;
  return false;
};

export const sendMutationWithOfflineQueue = async (
  url: string,
  init: RequestInit = {},
  options: OfflineMutationOptions = {}
) => {
  const method = (init.method || 'POST').toUpperCase() as QueuedMutationMethod;
  const normalizedHeaders = normalizeHeaders(init.headers);
  const baseRequest: RequestInit = {
    credentials: 'include',
    ...init,
    method,
    headers: normalizedHeaders,
  };

  if (
    !isMobileOfflineEnabled() ||
    typeof window === 'undefined' ||
    !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ||
    !canQueueMutationBody(baseRequest.body)
  ) {
    return fetch(url, baseRequest);
  }

  const serializedBody =
    typeof baseRequest.body === 'string'
      ? baseRequest.body
      : baseRequest.body instanceof URLSearchParams
        ? baseRequest.body.toString()
        : null;

  if (navigator.onLine === false) {
    await queueOfflineMutation({
      url,
      method,
      headers: normalizedHeaders,
      body: serializedBody,
      conflictKey: options.conflictKey,
      metadata: options.metadata,
    });
    await requestOfflineQueueSync();
    return { queued: true, offline: true } as const satisfies QueuedOfflineMutationResult;
  }

  try {
    return await fetch(url, {
      ...baseRequest,
      body: serializedBody ?? undefined,
    });
  } catch (error) {
    await queueOfflineMutation({
      url,
      method,
      headers: normalizedHeaders,
      body: serializedBody,
      conflictKey: options.conflictKey,
      metadata: options.metadata,
    });
    await requestOfflineQueueSync();
    return {
      queued: true,
      offline: true,
      error,
    } as const satisfies QueuedOfflineMutationResult;
  }
};

export const flushOfflineMutationsNow = async () => flushOfflineMutationQueue();
