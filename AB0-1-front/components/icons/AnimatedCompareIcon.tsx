import React, { useId } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface AnimatedCompareIconProps {
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  intensity?: 'subtle' | 'normal' | 'strong';

  /**
   * default:
   * Mantém a identidade azul existente do componente.
   *
   * solar:
   * Variante premium para superfícies escuras,
   * utilizada pela MobileBottomNav.
   */
  variant?: 'default' | 'solar';

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
} as const;

export const AnimatedCompareIcon = React.forwardRef<
  HTMLDivElement,
  AnimatedCompareIconProps
>(
  (
    {
      size = 'md',
      animated = true,
      active = false,
      selected = false,
      disabled = false,
      loading = false,
      intensity = 'normal',
      variant = 'default',
      className,
      'aria-hidden': ariaHidden,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const gradientId = useId().replace(/:/g, '');
    const pxSize =
      typeof size === 'number'
        ? size
        : sizeMap[size as keyof typeof sizeMap] ?? 24;

    if (loading) {
      return (
        <Loader2
          className={cn(
            'animate-spin',
            variant === 'solar'
              ? 'text-amber-400'
              : 'text-slate-400',
            className
          )}
          size={pxSize}
          aria-hidden="true"
        />
      );
    }

    if (selected) {
      return (
        <Check
          className={cn('text-emerald-500', className)}
          size={pxSize}
          aria-hidden={ariaHidden}
        />
      );
    }

    const getDuration = () => {
      switch (intensity) {
        case 'subtle':
          return '6s';

        case 'strong':
          return '2.5s';

        case 'normal':
        default:
          return '4s';
      }
    };

    const isSolar = variant === 'solar';

    const colors = isSolar
      ? {
          background: '#111827',
          baseBorder: '#FBBF24',
          arrowStart: '#FACC15',
          arrowEnd: '#F59E0B',
          highlightStart: '#FDE68A',
          highlightMiddle: '#FACC15',
          highlightEnd: '#F59E0B',
        }
      : {
          background: '#FFFFFF',
          baseBorder: '#BFDBFE',
          arrowStart: '#2563EB',
          arrowEnd: '#1D4ED8',
          highlightStart: '#93C5FD',
          highlightMiddle: '#2563EB',
          highlightEnd: '#1D4ED8',
        };

    return (
      <div
        ref={ref}
        className={cn(
          'group relative inline-flex shrink-0 items-center justify-center rounded-full',
          'transition-[transform,filter] duration-200 ease-out',

          active && !disabled
            ? 'scale-[0.96]'
            : 'scale-100',

          !disabled &&
            !isSolar &&
            'hover:scale-[1.03] hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.18)]',

          !disabled &&
            isSolar &&
            'hover:scale-[1.035] hover:drop-shadow-[0_0_9px_rgba(250,204,21,0.22)]',

          disabled && 'cursor-not-allowed opacity-45',

          className
        )}
        style={{
          width: pxSize,
          height: pxSize,
        }}
        aria-hidden={ariaHidden}
        aria-label={ariaLabel}
        {...props}
      >
        {/* Glow premium somente na variante Solar */}
        {isSolar && (
          <>
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-[-16%] rounded-full',
                'bg-amber-400/[0.07] blur-[5px]',
                animated &&
                  !disabled &&
                  'motion-safe:animate-pulse motion-reduce:animate-none'
              )}
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-8%] rounded-full border border-amber-400/10"
            />
          </>
        )}

        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative overflow-visible"
        >
          <defs>
            <linearGradient
              id={`${gradientId}-arrow-primary`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor={colors.arrowStart}
              />
              <stop
                offset="100%"
                stopColor={colors.arrowEnd}
              />
            </linearGradient>

            <linearGradient
              id={`${gradientId}-arrow-secondary`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor={colors.arrowEnd}
              />
              <stop
                offset="100%"
                stopColor={colors.arrowStart}
              />
            </linearGradient>

            <linearGradient
              id={`${gradientId}-border`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={colors.highlightStart}
              />
              <stop
                offset="50%"
                stopColor={colors.highlightMiddle}
              />
              <stop
                offset="100%"
                stopColor={colors.highlightEnd}
              />
            </linearGradient>

            {isSolar && (
              <radialGradient
                id={`${gradientId}-background`}
                cx="50%"
                cy="35%"
                r="75%"
              >
                <stop
                  offset="0%"
                  stopColor="#1F2937"
                />
                <stop
                  offset="75%"
                  stopColor="#111827"
                />
                <stop
                  offset="100%"
                  stopColor="#090E17"
                />
              </radialGradient>
            )}
          </defs>

          {/* Fundo */}
          <circle
            cx="12"
            cy="12"
            r="10.85"
            fill={
              isSolar
                ? `url(#${gradientId}-background)`
                : colors.background
            }
          />

          {/* Borda interna premium */}
          {isSolar && (
            <circle
              cx="12"
              cy="12"
              r="10.1"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.45"
            />
          )}

          {/* Borda base */}
          <circle
            cx="12"
            cy="12"
            r="11.35"
            fill="none"
            stroke={colors.baseBorder}
            strokeWidth={isSolar ? 0.75 : 1}
            opacity={isSolar ? 0.25 : 0.4}
          />

          {/* Segmento rotativo */}
          <circle
            cx="12"
            cy="12"
            r="11.35"
            fill="none"
            stroke={`url(#${gradientId}-border)`}
            strokeWidth={isSolar ? 1.35 : 1.2}
            strokeLinecap="round"
            strokeDasharray={isSolar ? '19 53' : '30 42'}
            className={cn(
              'origin-center',
              animated &&
                !disabled &&
                'motion-safe:animate-spin motion-reduce:animate-none'
            )}
            style={{
              animationDuration:
                animated && !disabled
                  ? getDuration()
                  : undefined,
            }}
          />

          {/* Segundo fragmento discreto para efeito premium */}
          {isSolar && (
            <circle
              cx="12"
              cy="12"
              r="11.35"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="0.65"
              strokeLinecap="round"
              strokeDasharray="4 68"
              opacity="0.75"
              className={cn(
                'origin-center',
                animated &&
                  !disabled &&
                  'motion-safe:animate-spin motion-reduce:animate-none'
              )}
              style={{
                animationDuration:
                  animated && !disabled
                    ? `${parseFloat(getDuration()) * 1.35}s`
                    : undefined,
                animationDirection: 'reverse',
              }}
            />
          )}

          {/* Seta superior */}
          <path
            d="M8 6.5L4.5 9L8 11.5M4.5 9H16"
            stroke={`url(#${gradientId}-arrow-primary)`}
            strokeWidth={isSolar ? 1.45 : 1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 ease-out',
              !disabled &&
                'group-hover:-translate-x-[1px]'
            )}
          />

          {/* Seta inferior */}
          <path
            d="M16 17.5L19.5 15L16 12.5M19.5 15H8"
            stroke={`url(#${gradientId}-arrow-secondary)`}
            strokeWidth={isSolar ? 1.45 : 1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 ease-out',
              !disabled &&
                'group-hover:translate-x-[1px]'
            )}
          />
        </svg>
      </div>
    );
  }
);

AnimatedCompareIcon.displayName = 'AnimatedCompareIcon';