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
            variant === 'solar' ? 'text-amber-500' : 'text-blue-600',
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
          return '2.5s';

        case 'normal':
        default:
          return '4s';
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
            ? 'scale-[0.96]'
            : 'scale-100',

          !disabled &&
            !isSolar &&
            'hover:scale-[1.03] hover:drop-shadow-[0_0_6px_rgba(37,99,235,0.16)]',

          !disabled &&
            isSolar &&
            'hover:scale-[1.03] hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.16)]',

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

          {/* Fundo interno menor */}
          <circle
            cx="12"
            cy="12"
            r="9.35"
            fill={colors.background}
          />

          {/* Borda base menor */}
          <circle
            cx="12"
            cy="12"
            r="9.85"
            fill="none"
            stroke={colors.baseBorder}
            strokeWidth="0.8"
            opacity="0.65"
          />

          {/* Circunferência animada menor */}
          <circle
            cx="12"
            cy="12"
            r="9.85"
            fill="none"
            stroke={`url(#${gradientId}-border)`}
            strokeWidth="1.05"
            strokeLinecap="round"
            strokeDasharray="20 42"
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
            d="M8.25 7L5.25 9.15L8.25 11.3M5.25 9.15H15.75"
            stroke={`url(#${gradientId}-arrow-primary)`}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 ease-out',
              !disabled &&
                'group-hover:-translate-x-[0.75px]'
            )}
          />

          {/* Seta inferior */}
          <path
            d="M15.75 17L18.75 14.85L15.75 12.7M18.75 14.85H8.25"
            stroke={`url(#${gradientId}-arrow-secondary)`}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 ease-out',
              !disabled &&
                'group-hover:translate-x-[0.75px]'
            )}
          />
        </svg>
      </div>
    );
  }
);

AnimatedCompareIcon.displayName = 'AnimatedCompareIcon';