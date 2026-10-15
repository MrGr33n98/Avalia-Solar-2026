'use client';

import React from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { cn } from '@/lib/utils';

export type QuoteCTAContext =
  | 'default'
  | 'compact'
  | 'card'
  | 'table'
  | 'comparison'
  | 'sticky'
  | 'hero'
  | 'mobile-footer';

type QuoteCTAProps = Omit<React.ComponentPropsWithoutRef<typeof Button>, 'children' | 'onClick'> & {
  companyId?: number | string;
  productId?: number | string;
  source?: string;
  context?: QuoteCTAContext;
  shortLabel?: string;
  loading?: boolean;
  onRequest?: () => void;
};

const contextClasses: Record<QuoteCTAContext, string> = {
  default: 'min-h-10 px-4 text-sm',
  compact: 'min-h-9 px-3 text-xs',
  card: 'min-h-9 min-w-0 px-3 text-[12px] rounded-[10px]',
  table: 'min-h-10 w-full px-3 text-xs sm:min-w-[168px] sm:w-auto',
  comparison: 'min-h-[38px] sm:min-h-10 w-full px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs leading-tight rounded-xl',
  sticky: 'min-h-11 px-4 text-sm',
  hero: 'min-h-11 px-5 text-sm sm:text-base',
  'mobile-footer': 'min-h-11 flex-1 px-3 text-sm',
};

export function QuoteCTA({
  companyId,
  productId: _productId,
  source,
  context = 'default',
  shortLabel = 'Orçamento',
  loading = false,
  disabled,
  onRequest,
  className,
  ...props
}: QuoteCTAProps) {
  const handleRequest = () => {
    onRequest?.();
    if (!onRequest) {
      openQuoteWizard({
        preferredCompanyId: companyId ? Number(companyId) : undefined,
        source,
      });
    }
  };
  const visibleLabel = context === 'card' ? shortLabel : 'Solicitar orçamento';
  const isComparison = context === 'comparison';

  return (
    <Button
      type="button"
      aria-label="Solicitar orçamento"
      disabled={loading || disabled}
      onClick={handleRequest}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold leading-tight transition-colors',
        context === 'card'
          ? 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50'
          : 'bg-blue-600 text-white hover:bg-blue-700',
        'min-w-0 max-w-full',
        contextClasses[context],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        <ClipboardList
          className={cn(
            'h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0',
            isComparison && 'hidden sm:inline-block'
          )}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          isComparison
            ? 'whitespace-normal text-center leading-tight break-words'
            : 'truncate'
        )}
      >
        {visibleLabel}
      </span>
    </Button>
  );
}
