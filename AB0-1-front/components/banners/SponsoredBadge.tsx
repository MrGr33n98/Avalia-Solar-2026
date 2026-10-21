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
 * - Formato: Retangular compacto com cantos levemente arredondados
 * - Dimensões: Altura fixa 18px (h-[18px]), largura auto (~65–72px), shrink-0
 * - Border radius: 4px (rounded-[4px])
 * - Tipografia: 9px / semibold / leading-none (text-[9px] font-semibold leading-none)
 * - Padding: px-[6px] py-0
 * - Posição: absolute right-2 top-2 z-20 pointer-events-none (8px de distância das bordas)
 * - Visual: bg-slate-950/95 text-white shadow-sm
 *
 * Desktop (>= 768px):
 * - Preserva estilo anterior: md:right-4 md:top-4 md:h-auto md:rounded-full md:px-3 md:py-2 md:text-xs md:leading-normal
 */
export function SponsoredBadge({ className, label = 'Patrocinado' }: SponsoredBadgeProps) {
  return (
    <span
      className={cn(
        'absolute right-2 top-2 z-20 pointer-events-none',
        'inline-flex h-[18px] w-auto shrink-0',
        'items-center justify-center whitespace-nowrap',
        'rounded-[4px] bg-slate-950/95 text-white',
        'px-[6px] py-0',
        'text-[9px] font-semibold leading-none',
        'shadow-sm',
        // Desktop: preservar o estilo anterior
        'md:right-4 md:top-4 md:h-auto',
        'md:rounded-full md:px-3 md:py-2',
        'md:text-xs md:leading-normal',
        className
      )}
      data-testid="sponsored-badge"
    >
      {label}
    </span>
  );
}

export default SponsoredBadge;
