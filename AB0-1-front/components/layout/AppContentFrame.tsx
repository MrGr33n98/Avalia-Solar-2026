'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type AppContentFrameProps = {
  children: ReactNode;
};

export default function AppContentFrame({ children }: AppContentFrameProps) {
  const pathname = usePathname();
  const isChatRoute = pathname === '/chat' || pathname?.startsWith('/chat/');

  return (
    <div
      className={isChatRoute ? 'pb-0' : 'pb-[calc(5.5rem+var(--safe-area-inset-bottom))] md:pb-0'}
    >
      {children}
    </div>
  );
}
