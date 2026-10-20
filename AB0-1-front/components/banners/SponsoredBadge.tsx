import React from 'react';
import { cn } from '@/lib/utils';

export interface SponsoredBadgeProps {
  className?: string;
  label?: string;
}

/**
 * Selo canônico "Patrocinado" para banners do Avalia Solar.
 *
 * Especificação Mobile/PWA (< 768px):
 * - Dimensões compactas: ~73x18px (fonte 9px, leading-[10px], px-[6px], py-[4px], rounded-full)
 * - Posição: absolute right-2 top-2 z-20
 * - Visual: bg-slate-950/95 text-white shadow-sm
 *
 * Desktop (>= 768px):
 * - md:right-4 md:top-4 md:px-3 md:py-2 md:text-xs
 */
export function SponsoredBadge({ className, label = 'Patrocinado' }: SponsoredBadgeProps) {
  return (
    <span
      className={cn(
        'absolute right-2 top-2 z-20',
        'inline-flex items-center justify-center',
        'whitespace-nowrap rounded-full',
        'bg-slate-950/95 text-white',
        'px-[6px] py-[4px]',
        'text-[9px] font-semibold leading-[10px]',
        'shadow-sm',
        'pointer-events-none',
        'md:right-4 md:top-4',
        'md:px-3 md:py-2',
        'md:text-xs',
        className
      )}
    >
      {label}
    </span>
  );
}

export default SponsoredBadge;
