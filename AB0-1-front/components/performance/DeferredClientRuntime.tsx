'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Keeps non-essential client features out of the initial route bundle and the
 * LCP/TBT window. They are mounted after the browser is idle, or immediately
 * when the visitor interacts with the page.
 */
const ComparisonFloatingBar = dynamic(() => import('@/components/ComparisonFloatingBar'), {
  ssr: false,
});
const GlobalChatWidget = dynamic(() => import('@/components/chat/GlobalChatWidget'), {
  ssr: false,
});
const PwaOfflineController = dynamic(() => import('@/components/PwaOfflineController'), {
  ssr: false,
});
const TabNotificationNotifier = dynamic(
  () =>
    import('@/components/notifications/TabNotificationNotifier').then((module) => ({
      default: module.TabNotificationNotifier,
    })),
  { ssr: false }
);
const NewRelicBrowser = dynamic(() => import('@/components/observability/NewRelicBrowser'), {
  ssr: false,
});
const ClipboardTracker = dynamic(() => import('@/components/ClipboardTracker'), { ssr: false });

export default function DeferredClientRuntime() {
  const [isReady, setIsReady] = useState(false);
  const [hasComparison, setHasComparison] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const readComparison = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('ab01_comparison_list') || '[]');
        setHasComparison(Array.isArray(saved) && saved.length > 0);
      } catch {
        setHasComparison(false);
      }
    };

    readComparison();
    window.addEventListener('avalia:comparison-updated', readComparison);
    const openComparisonDock = () => setHasComparison(true);
    window.addEventListener('avalia:open-comparison-dock', openComparisonDock);
    return () => {
      window.removeEventListener('avalia:comparison-updated', readComparison);
      window.removeEventListener('avalia:open-comparison-dock', openComparisonDock);
    };
  }, []);

  useEffect(() => {
    const markReady = () => setIsReady(true);
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const idleId = idleWindow.requestIdleCallback?.(markReady, { timeout: 8_000 });
    const timeoutId = idleId == null ? window.setTimeout(markReady, 8_000) : undefined;

    window.addEventListener('pointerdown', markReady, { once: true, passive: true });
    window.addEventListener('keydown', markReady, { once: true });
    window.addEventListener('touchstart', markReady, { once: true, passive: true });

    return () => {
      if (idleId != null) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
      window.removeEventListener('pointerdown', markReady);
      window.removeEventListener('keydown', markReady);
      window.removeEventListener('touchstart', markReady);
    };
  }, []);

  if (!isReady && !hasComparison) return null;

  return (
    <>
      {isReady ? (
        <>
          <ClipboardTracker />
          <NewRelicBrowser />
          {isAuthenticated ? <TabNotificationNotifier /> : null}
          {process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE === 'true' ? <PwaOfflineController /> : null}
          {isAuthenticated ? <GlobalChatWidget /> : null}
        </>
      ) : null}
      {hasComparison ? <ComparisonFloatingBar /> : null}
    </>
  );
}
