'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type OpportunitiesCardProps = {
  className?: string;
  title?: string;
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
};

export default function OpportunitiesCard({
  className,
  title = 'Oportunidades',
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: OpportunitiesCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'w-full rounded-xl bg-blue-600 text-white shadow-sm',
        'px-5 py-4 md:px-6 md:py-5',
        className
      )}
      aria-label="Card de oportunidades"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Info className="h-4 w-4 text-white/90" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/10 px-4 py-4 text-center">
          <div className="text-[11px] font-medium text-white/90">{leftLabel}</div>
          <div className="mt-2 text-5xl leading-none font-extrabold tabular-nums">{leftValue}</div>
        </div>
        <div className="rounded-lg bg-white/10 px-4 py-4 text-center">
          <div className="text-[11px] font-medium text-white/90">{rightLabel}</div>
          <div className="mt-2 text-5xl leading-none font-extrabold tabular-nums">{rightValue}</div>
        </div>
      </div>
    </motion.section>
  );
}

