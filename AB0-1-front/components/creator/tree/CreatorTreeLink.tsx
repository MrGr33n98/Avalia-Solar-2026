'use client';

import type { ReactNode, MouseEvent, CSSProperties } from 'react';
import { publicCreatorTreeApi } from '@/lib/api/creatorTree';

type Props = {
  slug: string;
  blockId: number;
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function CreatorTreeLink({ slug, blockId, href, className, style, children }: Props) {
  const handleClick = (_event: MouseEvent<HTMLAnchorElement>) => {
    void publicCreatorTreeApi.trackClick(slug, blockId);
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={style} rel="noreferrer">
      {children}
    </a>
  );
}
