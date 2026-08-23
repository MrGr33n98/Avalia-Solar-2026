'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type AppContentFrameProps = {
  children: ReactNode;
};

export default function AppContentFrame({ children }: AppContentFrameProps) {
  const pathname = usePathname();
  const isChatRoute = pathname === '/chat' || pathname?.startsWith('/chat/');
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isReviewerRoute = pathname === '/review-dashboard' || pathname?.startsWith('/review-dashboard/');

  return (
    <div
      className={
        isChatRoute || isDashboardRoute || isReviewerRoute
          ? 'pb-0'
          : 'pb-[calc(5.5rem+var(--safe-area-inset-bottom))] md:pb-0'
      }
      style={{ width: '100%', maxWidth: '100%', overflowX: 'clip' }}
    >
      {children}
    </div>
  );
}
