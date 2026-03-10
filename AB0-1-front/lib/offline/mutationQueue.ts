import {
  OFFLINE_MAX_RETRIES,
  OFFLINE_QUEUE_CHANGED_EVENT,
  OFFLINE_QUEUE_SYNC_EVENT,
  OFFLINE_SYNC_TAG,
  buildOfflineConflictKey,
  getOfflineRetryDelayMs,
  isRetryableOfflineStatus,
} from './config';
import {
  getOfflineDb,
  type QueuedMutationMethod,
  type QueuedMutationRecord,
} from './db';

export interface QueueOfflineMutationInput {
  url: string;
  method: QueuedMutationMethod;
  headers?: Record<string, string>;
  body?: string | null;
  conflictKey?: string;
  metadata?: Record<string, unknown>;
}

export interface OfflineFlushResult {
  processed: number;
  succeeded: number;
  retried: number;
  failed: number;
  remaining: number;
}

const dispatchOfflineEvent = (eventName: string, detail: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const buildRequestKey = (url: string, method: string, conflictKey: string) =>
  `${method.toUpperCase()}:${url}:${conflictKey}`;

const shouldDiscardMutation = (status?: number) => {
  if (status === undefined || status === null) return false;
  return status >= 400 && !isRetryableOfflineStatus(status);
};

const getDueMutations = async (limit = 25) => {
  const db = getOfflineDb();
  if (!db) return [];

  const allMutations = await db.mutationQueue.toArray();
  const now = Date.now();

  return allMutations
    .filter((mutation) => mutation.nextRetryAt <= now)
    .sort((left, right) => left.createdAt - right.createdAt)
    .slice(0, limit);
};

const retryQueuedMutation = async (
  mutation: QueuedMutationRecord,
  errorMessage: string,
  status?: number
) => {
  const db = getOfflineDb();
  if (!db || mutation.id == null) return 'failed' as const;

  const nextRetryCount = mutation.retryCount + 1;

  if (shouldDiscardMutation(status) || nextRetryCount > OFFLINE_MAX_RETRIES) {
    await db.mutationQueue.delete(mutation.id);
    return 'failed' as const;
  }

  await db.mutationQueue.update(mutation.id, {
    retryCount: nextRetryCount,
    nextRetryAt: Date.now() + getOfflineRetryDelayMs(mutation.retryCount),
    updatedAt: Date.now(),
    lastError: errorMessage,
  });

  return 'retried' as const;
};

export const getPendingQueuedMutationCount = async () => {
  const db = getOfflineDb();
  if (!db) return 0;
  return db.mutationQueue.count();
};

export const queueOfflineMutation = async ({
  url,
  method,
  headers = {},
  body = null,
  conflictKey,
  metadata = {},
}: QueueOfflineMutationInput) => {
  const db = getOfflineDb();
  if (!db) return null;

  const now = Date.now();
  const resolvedConflictKey = buildOfflineConflictKey({
    url,
    method,
    conflictKey,
  });

  const duplicatedMutations = await db.mutationQueue
    .where('conflictKey')
    .equals(resolvedConflictKey)
    .toArray();

  if (duplicatedMutations.length > 0) {
    const duplicatedIds = duplicatedMutations
      .map((mutation) => mutation.id)
      .filter((value): value is number => typeof value === 'number');

    if (duplicatedIds.length > 0) {
      await db.mutationQueue.bulkDelete(duplicatedIds);
    }
  }

  const requestKey = buildRequestKey(url, method, resolvedConflictKey);

  const mutationId = await db.mutationQueue.add({
    url,
    method,
    headers,
    body,
    conflictKey: resolvedConflictKey,
    requestKey,
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    nextRetryAt: now,
    lastError: null,
    metadata,
  });

  const queued = await db.mutationQueue.count();
  dispatchOfflineEvent(OFFLINE_QUEUE_CHANGED_EVENT, { queued, mutationId });

  return { mutationId, queued };
};

export const requestOfflineQueueSync = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      const syncRegistration = registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      };

      await syncRegistration.sync.register(OFFLINE_SYNC_TAG);
      return true;
    }

    registration.active?.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
    return true;
  } catch {
    return false;
  }
};

export const flushOfflineMutationQueue = async (): Promise<OfflineFlushResult> => {
  const db = getOfflineDb();
  if (!db) {
    return {
      processed: 0,
      succeeded: 0,
      retried: 0,
      failed: 0,
      remaining: 0,
    };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      processed: 0,
      succeeded: 0,
      retried: 0,
      failed: 0,
      remaining: await db.mutationQueue.count(),
    };
  }

  const dueMutations = await getDueMutations();
  let succeeded = 0;
  let retried = 0;
  let failed = 0;

  for (const mutation of dueMutations) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body ?? undefined,
        credentials: 'include',
      });

      if (response.ok) {
        if (mutation.id != null) {
          await db.mutationQueue.delete(mutation.id);
        }
        succeeded += 1;
        continue;
      }

      const result = await retryQueuedMutation(
        mutation,
        `[${response.status}] ${response.statusText}`,
        response.status
      );
      if (result === 'retried') {
        retried += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      const result = await retryQueuedMutation(
        mutation,
        error instanceof Error ? error.message : 'Offline mutation failed'
      );
      if (result === 'retried') {
        retried += 1;
      } else {
        failed += 1;
      }
    }
  }

  const remaining = await db.mutationQueue.count();
  const result = {
    processed: dueMutations.length,
    succeeded,
    retried,
    failed,
    remaining,
  };

  dispatchOfflineEvent(OFFLINE_QUEUE_CHANGED_EVENT, { queued: remaining });
  dispatchOfflineEvent(OFFLINE_QUEUE_SYNC_EVENT, result);

  return result;
};
