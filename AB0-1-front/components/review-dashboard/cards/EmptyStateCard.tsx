'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon, FileText } from 'lucide-react';
import Link from 'next/link';

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
        'flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 px-8 py-12 text-center',
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
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-500 transition-colors"
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            onClick={onCtaClick}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-500 transition-colors"
          >
            {ctaLabel}
          </button>
        )
      )}
    </div>
  );
}
