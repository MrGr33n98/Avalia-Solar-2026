'use client';

import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

interface TipCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function TipCard({ title = 'Dica da Comunidade', children, className }: TipCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50/50 p-5',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-100 p-2 shrink-0">
          <Lightbulb className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">{title}</p>
          <div className="mt-1 text-[13px] text-amber-800 leading-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
