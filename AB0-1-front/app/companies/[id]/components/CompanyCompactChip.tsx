'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type CompanyCompactChipProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & {
  selected: boolean;
  density?: 'tab' | 'filter';
};

/**
 * Brand Page-only V2 chip.
 * Keeps a 44px interactive target while the visible pill is 36px (tab) or 32px (filter).
 * No global Button overrides; longer labels remain on one line and scroll inside their rail.
 */
export const CompanyCompactChip = React.forwardRef<HTMLButtonElement, CompanyCompactChipProps>(
  ({ selected, density = 'tab', className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        'group inline-flex h-11 min-h-11 min-w-11 shrink-0 snap-start items-center justify-center rounded-full px-0.5',
        'whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1',
        className
      )}
    >
      <span
        data-testid={density === 'tab' ? 'company-mobile-tab-surface' : 'company-faq-filter-surface'}
        className={cn(
          'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border text-[12px] leading-4',
          'transition-colors duration-150 [overflow-wrap:normal] [hyphens:none]',
          density === 'tab' ? 'h-9 gap-1.5 px-3' : 'h-8 gap-1 px-3',
          selected
            ? 'border-blue-600 bg-blue-600 font-semibold text-white'
            : 'border-slate-200 bg-slate-100 font-medium text-slate-700 group-hover:bg-slate-200'
        )}
      >
        {children}
      </span>
    </button>
  )
);

CompanyCompactChip.displayName = 'CompanyCompactChip';
