'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const OFFICIAL_VERIFIED_MESSAGE =
  'Empresa verificada pelo Avalia Solar.\n\nAs informações cadastrais passaram pelo nosso processo de verificação.';

export interface CompanyVerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tooltipText?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

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
  tooltipText?: string;
}

export function OfficialVerifiedIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-[18px] w-[18px] shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        fill="#0056D2"
        className="fill-blue-600 dark:fill-blue-500"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompanyVerifiedBadge({
  className,
  size = 'md',
  tooltipText = OFFICIAL_VERIFIED_MESSAGE,
  title,
  onClick,
}: CompanyVerifiedBadgeProps) {
  const [open, setOpen] = React.useState(false);

  const sizeClasses = {
    sm: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
    md: 'h-[18px] w-[18px]',
    lg: 'h-5 w-5 sm:h-6 sm:w-6',
  };

  const displayText = title || tooltipText;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
    setOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setOpen((prev) => !prev);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            aria-label={displayText}
            title={displayText}
            className="inline-flex items-center justify-center shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
          >
            <OfficialVerifiedIcon className={cn(sizeClasses[size], className)} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={6}
          onPointerDownOutside={() => setOpen(false)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="z-[9999] max-w-[260px] rounded-xl border border-slate-700/60 bg-[#0f172a] px-3.5 py-2.5 text-center text-xs font-medium leading-relaxed text-slate-100 shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <p className="select-none leading-snug whitespace-pre-line text-left">{displayText}</p>
          <TooltipPrimitive.Arrow className="fill-[#0f172a]" width={10} height={5} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CompanyVerifiedBadge;
