'use client';

import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VerificationBadgeProps {
  verification?: {
    status?: string;
    verified?: boolean;
    verified_at?: string | null;
    method?: string | null;
  } | null;
  verified?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VerificationBadge({
  verification,
  verified,
  className,
  size = 'md',
}: VerificationBadgeProps) {
  const isVerified = verification ? verification.verified === true || verification.status === 'verified' : Boolean(verified);

  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5 sm:h-[22px] sm:w-[22px]',
    lg: 'h-6 w-6',
  };

  return (
    <span
      className={cn('inline-flex items-center shrink-0', className)}
      title="Empresa Verificada Oficial Avalia Solar"
      aria-label="Empresa Verificada Oficial Avalia Solar"
    >
      <BadgeCheck
        className={cn(
          sizeClasses[size],
          'fill-blue-100 text-blue-600 dark:fill-blue-950 dark:text-blue-400'
        )}
        aria-hidden="true"
      />
    </span>
  );
}
