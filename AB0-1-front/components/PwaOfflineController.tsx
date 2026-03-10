'use client';

import { useEffect } from 'react';

import {
  OFFLINE_QUEUE_CHANGED_EVENT,
  OFFLINE_QUEUE_SYNC_EVENT,
  isMobileOfflineEnabled,
} from '@/lib/offline/config';
import {
  flushOfflineMutationQueue,
  getPendingQueuedMutationCount,
} from '@/lib/offline/mutationQueue';
import { useOfflineStore } from '@/store/offlineStore';

const refreshQueueSize = async (setQueueSize: (queueSize: number) => void) => {
  const queueSize = await getPendingQueuedMutationCount();
  setQueueSize(queueSize);
};

export default function PwaOfflineController() {
  const setOnline = useOfflineStore((state) => state.setOnline);
  const setSwSupported = useOfflineStore((state) => state.setSwSupported);
  const setSwRegistered = useOfflineStore((state) => state.setSwRegistered);
  const setBackgroundSyncSupported = useOfflineStore(
    (state) => state.setBackgroundSyncSupported
  );
  const setUpdateAvailable = useOfflineStore((state) => state.setUpdateAvailable);
  const setQueueSize = useOfflineStore((state) => state.setQueueSize);
  const setLastSyncAt = useOfflineStore((state) => state.setLastSyncAt);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const handleOffline = () => {
      setOnline(false);
    };

    const handleOnline = async () => {
      setOnline(true);
      const result = await flushOfflineMutationQueue();
      if (!isMounted) return;
      setLastSyncAt(Date.now());
      setQueueSize(result.remaining);
    };

    const handleQueueChanged = async () => {
      if (!isMounted) return;
      await refreshQueueSize(setQueueSize);
    };

    const handleQueueSynced = async () => {
      if (!isMounted) return;
      setLastSyncAt(Date.now());
      await refreshQueueSize(setQueueSize);
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!isMounted) return;

      if (event.data?.type === 'OFFLINE_QUEUE_SYNC') {
        if (typeof event.data.remaining === 'number') {
          setQueueSize(event.data.remaining);
        }
        setLastSyncAt(Date.now());
      }

      if (
        event.data?.type === 'OFFLINE_QUEUE_CHANGED' &&
        typeof event.data.queued === 'number'
      ) {
        setQueueSize(event.data.queued);
      }
    };

    const setupServiceWorker = async () => {
      try {
        setOnline(navigator.onLine);
        await refreshQueueSize(setQueueSize);

        if (!('serviceWorker' in navigator)) {
          setSwSupported(false);
          setSwRegistered(false);
          setBackgroundSyncSupported(false);
          return;
        }

        setSwSupported(true);

        if (!isMobileOfflineEnabled()) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations
              .filter((registration) =>
                registration.active?.scriptURL.includes('/sw.js')
              )
              .map((registration) => registration.unregister())
          );
          setSwRegistered(false);
          setBackgroundSyncSupported(false);
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        if (!isMounted) return;

        setSwRegistered(true);
        setBackgroundSyncSupported('sync' in registration);
        setUpdateAvailable(Boolean(registration.waiting));

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (!isMounted) return;
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
              installingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      } catch (error) {
        if (!isMounted) return;
        setSwRegistered(false);
        setBackgroundSyncSupported(false);

        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to initialize mobile offline service worker', error);
        }
      }
    };

    void setupServiceWorker();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(
      OFFLINE_QUEUE_CHANGED_EVENT,
      handleQueueChanged as EventListener
    );
    window.addEventListener(
      OFFLINE_QUEUE_SYNC_EVENT,
      handleQueueSynced as EventListener
    );
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        OFFLINE_QUEUE_CHANGED_EVENT,
        handleQueueChanged as EventListener
      );
      window.removeEventListener(
        OFFLINE_QUEUE_SYNC_EVENT,
        handleQueueSynced as EventListener
      );
      navigator.serviceWorker?.removeEventListener(
        'message',
        handleServiceWorkerMessage
      );
    };
  }, [
    setBackgroundSyncSupported,
    setLastSyncAt,
    setOnline,
    setQueueSize,
    setSwRegistered,
    setSwSupported,
    setUpdateAvailable,
  ]);

  return null;
}
