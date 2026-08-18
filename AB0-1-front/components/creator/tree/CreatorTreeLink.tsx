'use client';

import type { ReactNode, MouseEvent } from 'react';
import { publicCreatorTreeApi } from '@/lib/api/creatorTree';

type Props = {
  slug: string;
  blockId: number;
  href: string;
  className?: string;
  children: ReactNode;
};

export function CreatorTreeLink({ slug, blockId, href, className, children }: Props) {
  const handleClick = (_event: MouseEvent<HTMLAnchorElement>) => {
    void publicCreatorTreeApi.trackClick(slug, blockId);
  };

  return (
    <a href={href} onClick={handleClick} className={className} rel="noreferrer">
      {children}
    </a>
  );
}
