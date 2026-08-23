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
  variant?: 'default' | 'solar';
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

const sizeMap = {
  xs: 14,
  sm: 18,
  md: 20,
  lg: 28,
  xl: 36,
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
        : sizeMap[size as keyof typeof sizeMap] ?? 20;

    if (loading) {
      return (
        <Loader2
          className={cn(
            'animate-spin',
            variant === 'solar'
              ? 'text-amber-500'
              : 'text-blue-600',
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
          className={cn('text-emerald-600', className)}
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
          return '2.8s';

        case 'normal':
        default:
          return '4.5s';
      }
    };

    const isSolar = variant === 'solar';

    const colors = isSolar
      ? {
          background: '#FFFFFF',
          baseBorder: '#FDE68A',
          arrowStart: '#F59E0B',
          arrowEnd: '#D97706',
          highlightStart: '#FDE68A',
          highlightMiddle: '#FBBF24',
          highlightEnd: '#F59E0B',
        }
      : {
          background: '#FFFFFF',
          baseBorder: '#DBEAFE',
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
            ? 'scale-[0.97]'
            : 'scale-100',

          !disabled &&
            !isSolar &&
            'hover:scale-[1.025] hover:drop-shadow-[0_0_4px_rgba(37,99,235,0.14)]',

          !disabled &&
            isSolar &&
            'hover:scale-[1.025] hover:drop-shadow-[0_0_4px_rgba(245,158,11,0.14)]',

          disabled &&
            'cursor-not-allowed opacity-40',

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
          </defs>

          {/* Fundo interno compacto */}
          <circle
            cx="12"
            cy="12"
            r="8.25"
            fill={colors.background}
          />

          {/* Circunferência base compacta */}
          <circle
            cx="12"
            cy="12"
            r="8.75"
            fill="none"
            stroke={colors.baseBorder}
            strokeWidth="0.7"
            opacity="0.6"
          />

          {/* Circunferência animada compacta */}
          <circle
            cx="12"
            cy="12"
            r="8.75"
            fill="none"
            stroke={`url(#${gradientId}-border)`}
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeDasharray="17 38"
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

          {/* Seta superior */}
          <path
            d="M8.7 7.6L6 9.45L8.7 11.3M6 9.45H15.4"
            stroke={`url(#${gradientId}-arrow-primary)`}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 ease-out',

              !disabled &&
                'group-hover:-translate-x-[0.6px]'
            )}
          />

          {/* Seta inferior */}
          <path
            d="M15.3 16.4L18 14.55L15.3 12.7M18 14.55H8.6"
            stroke={`url(#${gradientId}-arrow-secondary)`}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 ease-out',

              !disabled &&
                'group-hover:translate-x-[0.6px]'
            )}
          />
        </svg>
      </div>
    );
  }
);

AnimatedCompareIcon.displayName = 'AnimatedCompareIcon';