import Dexie, { type Table } from 'dexie';

import { OFFLINE_DB_NAME } from './config';

export type QueuedMutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface QueuedMutationRecord {
  id?: number;
  url: string;
  method: QueuedMutationMethod;
  headers: Record<string, string>;
  body: string | null;
  conflictKey: string;
  requestKey: string;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  nextRetryAt: number;
  lastError: string | null;
  metadata: Record<string, unknown> | null;
}

class AvaliaOfflineDb extends Dexie {
  mutationQueue!: Table<QueuedMutationRecord, number>;

  constructor() {
    super(OFFLINE_DB_NAME);

    this.version(1).stores({
      mutationQueue:
        '++id, requestKey, conflictKey, nextRetryAt, createdAt, updatedAt',
    });
  }
}

let dbInstance: AvaliaOfflineDb | null = null;

export const hasOfflineDbSupport = () => typeof indexedDB !== 'undefined';

export const getOfflineDb = () => {
  if (!hasOfflineDbSupport()) return null;

  if (!dbInstance) {
    dbInstance = new AvaliaOfflineDb();
  }

  return dbInstance;
};
