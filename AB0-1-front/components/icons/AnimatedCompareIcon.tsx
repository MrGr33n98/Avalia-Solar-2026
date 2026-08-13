import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Check } from 'lucide-react';

export interface AnimatedCompareIconProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

const sizeMap = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

export const AnimatedCompareIcon = React.forwardRef<HTMLDivElement, AnimatedCompareIconProps>(
  (
    {
      size = 'md',
      animated = true,
      active = false,
      selected = false,
      disabled = false,
      loading = false,
      intensity = 'normal',
      className,
      'aria-hidden': ariaHidden,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const pxSize = typeof size === 'number' ? size : sizeMap[size as keyof typeof sizeMap] || 24;

    if (loading) {
      return <Loader2 className={cn('animate-spin text-slate-400', className)} size={pxSize} aria-hidden="true" />;
    }

    if (selected) {
      return (
        <Check 
          className={cn('text-green-600', className)} 
          size={pxSize} 
          aria-hidden={ariaHidden}
        />
      );
    }

    const getDuration = () => {
      switch (intensity) {
        case 'subtle': return '6s';
        case 'strong': return '2.5s';
        case 'normal':
        default: return '4s';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full transition-all duration-200 ease-out group',
          active && !disabled ? 'scale-[0.94]' : 'scale-100',
          !disabled ? 'hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(234,179,8,0.15)]' : '',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{ width: pxSize, height: pxSize }}
        aria-hidden={ariaHidden}
        aria-label={ariaLabel}
        {...props}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="arrowBlueGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            <linearGradient id="arrowBlueSecondaryGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            <linearGradient id="borderHighlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            
            <style>
              {`
                @media (prefers-reduced-motion: no-preference) {
                  .border-anim {
                    transform-origin: 12px 12px;
                    ${!disabled && animated ? `animation: spinBorder ${getDuration()} linear infinite;` : ''}
                  }
                  .group:hover .arrow-top {
                    transform: translateX(-1.5px);
                  }
                  .group:hover .arrow-bottom {
                    transform: translateX(1.5px);
                  }
                  @keyframes spinBorder {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                }
                .arrow-top, .arrow-bottom {
                  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
              `}
            </style>
          </defs>

          {/* Fundo interno */}
          <circle cx="12" cy="12" r="11" fill="white" />
          
          {/* Borda Base Estática - muito sutil */}
          <circle 
            cx="12" 
            cy="12" 
            r="11.5" 
            fill="none" 
            stroke="#fef08a" 
            strokeWidth="1" 
            className="opacity-40"
          />

          {/* Borda Animada (Highlight) */}
          <circle 
            cx="12" 
            cy="12" 
            r="11.5" 
            fill="none" 
            stroke="url(#borderHighlightGrad)" 
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="30 42"
            strokeDashoffset="0"
            className="border-anim"
          />

          {/* Seta Superior (Esquerda - Azul) */}
          <path
            d="M8.5 8L5.5 10.5L8.5 13M5.5 10.5H15.5"
            stroke="url(#arrowBlueGrad)"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="arrow-top"
          />

          {/* Seta Inferior (Direita - Amarela/Laranja) */}
          <path
            d="M15.5 16L18.5 13.5L15.5 11M18.5 13.5H8.5"
            stroke="url(#arrowBlueSecondaryGrad)"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="arrow-bottom"
          />
        </svg>
      </div>
    );
  }
);

AnimatedCompareIcon.displayName = 'AnimatedCompareIcon';
