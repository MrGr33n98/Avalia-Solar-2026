import * as React from 'react';
import Link from 'next/link';

import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { cn } from '@/lib/utils';

export interface HomeFeaturedChipProps {
  href: string;
  name: string;
  slug?: string | null;
  visualKey?: string | null;
  iconUrl?: string | null;
  priority?: boolean;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
}

export function HomeFeaturedChip({
  href,
  name,
  slug,
  visualKey,
  iconUrl,
  priority = false,
  selected = false,
  className,
  onClick,
}: HomeFeaturedChipProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'group inline-flex min-h-[44px] sm:min-h-[48px] h-auto shrink-0 snap-start items-center gap-2 rounded-lg border border-[#E4EAF2] bg-white px-2.5 py-1.5 text-left transition-colors duration-150',
        'hover:border-[#CBD5E1] hover:bg-[#F8FAFC]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1',
        selected && 'border-[#165DCE] bg-blue-50/80 text-blue-900',
        className
      )}
    >
      <CategoryIcon
        slug={slug}
        name={name}
        visualKey={visualKey}
        iconUrl={iconUrl}
        size={28}
        priority={priority}
        className="shrink-0"
      />
      <span className="min-w-0 max-w-[190px] text-xs font-semibold leading-[1.2] text-[#0B1736] line-clamp-2">
        {name}
      </span>
    </Link>
  );
}

export default HomeFeaturedChip;
