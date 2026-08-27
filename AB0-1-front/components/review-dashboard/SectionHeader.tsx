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
    <div className={cn('flex items-center justify-between mb-5 gap-4', className)}>
      <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
      {linkLabel && linkHref && (
        <Link
          href={linkHref}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
