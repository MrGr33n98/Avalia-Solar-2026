'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buildCompanySubPath } from '@/lib/slug';

type ReviewCompanyButtonProps = {
  company: {
    id: number | string;
    slug?: string | null;
    name?: string | null;
  };
  label?: string;
  compactLabel?: string;
  className?: string;
  iconClassName?: string;
  stopPropagation?: boolean;
};

export default function ReviewCompanyButton({
  company,
  label = 'Avaliar empresa',
  compactLabel,
  className,
  iconClassName,
  stopPropagation = false,
}: ReviewCompanyButtonProps) {
  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);
  const accessibleName = company.name ? `${label}: ${company.name}` : label;

  return (
    <Link
      href={reviewPath}
      aria-label={accessibleName}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
      }}
      className={cn(
        'inline-flex min-h-11 min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-blue-700 shadow-none transition-all hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:ring-offset-2 active:scale-[0.98]',
        className
      )}
    >
      <Star className={cn('h-4 w-4 fill-blue-700 text-blue-700', iconClassName)} aria-hidden="true" />
      {compactLabel ? (
        <>
          <span className="truncate sm:hidden">{compactLabel}</span>
          <span className="truncate sm:inline">{label}</span>
        </>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );
}
