'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyStateCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function EmptyStateCard({
  icon: Icon = FileText,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-gradient-to-b from-white to-blue-50/40 px-8 py-14 text-center shadow-[0_12px_30px_-26px_rgb(37_99_235_/_0.55)]',
        className
      )}
    >
      <div className="rounded-2xl bg-blue-50 p-4 mb-4">
        <Icon className="h-8 w-8 text-blue-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500 leading-5">{description}</p>
      {ctaLabel && (
        ctaHref ? (
          <Link
            href={ctaHref}
            className="mt-5"
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            onClick={onCtaClick}
            className="mt-5"
          >
            {ctaLabel}
          </button>
        )
      )}
    </div>
  );
}
