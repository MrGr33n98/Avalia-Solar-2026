'use client';

import { useEffect } from 'react';

const RETRY_KEY = 'avalia:chunk-load-recovery';

function isChunkLoadFailure(value: unknown) {
  const message = value instanceof Error ? value.message : String(value || '');
  return /ChunkLoadError|Loading (CSS )?chunk|Failed to fetch dynamically imported module|dynamically imported module/i.test(
    message
  );
}

async function clearRuntimeCaches() {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('avalia-app-shell-') || name.startsWith('avalia-static-'))
      .map((name) => caches.delete(name))
  );
}

export default function ChunkLoadRecovery() {
  useEffect(() => {
    let recovering = false;

    const recover = (value: unknown) => {
      if (recovering || !isChunkLoadFailure(value)) return;

      const lastRecovery = sessionStorage.getItem(RETRY_KEY);
      const recoveryPath = window.location.pathname;
      if (lastRecovery === recoveryPath) {
        sessionStorage.removeItem(RETRY_KEY);
        return;
      }

      recovering = true;
      sessionStorage.setItem(RETRY_KEY, recoveryPath);

      void clearRuntimeCaches().finally(() => {
        window.location.reload();
      });
    };

    const handleError = (event: ErrorEvent) => recover(event.error || event.message);
    const handleRejection = (event: PromiseRejectionEvent) => recover(event.reason);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}