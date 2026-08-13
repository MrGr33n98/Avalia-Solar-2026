'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  linkLabel?: string;
  linkHref?: string;
  className?: string;
}

export function SectionHeader({ title, linkLabel, linkHref, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {linkLabel && linkHref && (
        <Link
          href={linkHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
