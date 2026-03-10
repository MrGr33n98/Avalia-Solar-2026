import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';

import {
  isQueuedOfflineMutationResult,
  sendMutationWithOfflineQueue,
  type QueuedOfflineMutationResult,
} from './offlineTransport';
import type { QueuedMutationMethod } from './db';

interface SendJsonApiMutationOptions {
  method?: QueuedMutationMethod;
  body?: unknown;
  headers?: Record<string, string>;
  conflictKey?: string;
  metadata?: Record<string, unknown>;
  keepalive?: boolean;
}

type QueueableApiMutationResult = Response | QueuedOfflineMutationResult;

export const sendJsonApiMutationWithOfflineQueue = async (
  endpoint: string,
  {
    method = 'POST',
    body,
    headers = {},
    conflictKey,
    metadata,
    keepalive,
  }: SendJsonApiMutationOptions = {}
): Promise<QueueableApiMutationResult> => {
  const normalizedMethod = method.toUpperCase() as QueuedMutationMethod;
  const requestHeaders = getApiRequestHeaders(
    body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
  );

  return sendMutationWithOfflineQueue(
    buildApiUrl(endpoint),
    {
      method: normalizedMethod,
      headers: {
        ...requestHeaders,
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : typeof body === 'string'
              ? body
              : JSON.stringify(body),
      credentials: 'include',
      keepalive,
    },
    {
      conflictKey,
      metadata,
    }
  );
};

export { isQueuedOfflineMutationResult };
