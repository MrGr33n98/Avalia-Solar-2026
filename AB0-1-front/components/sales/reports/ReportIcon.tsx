'use client';

import React from 'react';
import Image from 'next/image';

export type ReportIconSize = 'sm' | 'md' | 'lg' | 'xl';
export type ReportIconTone = 'neutral' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';

export interface ReportIconProps {
  src: string;
  alt?: string;
  size?: ReportIconSize;
  tone?: ReportIconTone;
  className?: string;
  containerClassName?: string;
}

const sizeMap: Record<ReportIconSize, { px: number; containerClass: string }> = {
  sm: { px: 18, containerClass: 'h-7 w-7 rounded-md p-1' },
  md: { px: 22, containerClass: 'h-9 w-9 rounded-lg p-1.5' },
  lg: { px: 28, containerClass: 'h-11 w-11 rounded-xl p-2' },
  xl: { px: 36, containerClass: 'h-14 w-14 rounded-2xl p-2.5' },
};

const toneMap: Record<ReportIconTone, string> = {
  neutral: 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60',
  blue: 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50',
  emerald: 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50',
  amber: 'bg-amber-50/80 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50',
  rose: 'bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50',
  purple: 'bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50',
};

export const ReportIcon: React.FC<ReportIconProps> = ({
  src,
  alt = '',
  size = 'md',
  tone = 'blue',
  className = '',
  containerClassName = '',
}) => {
  const { px, containerClass } = sizeMap[size];
  const toneClass = toneMap[tone];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-transform ${containerClass} ${toneClass} ${containerClassName}`}
    >
      <Image
        src={src}
        alt={alt}
        width={px}
        height={px}
        className={`object-contain ${className}`}
        unoptimized
      />
    </div>
  );
};
