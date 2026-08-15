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
  card: 'min-h-10 w-full px-3 text-sm',
  table: 'min-h-10 w-full px-3 text-xs sm:min-w-[168px] sm:w-auto',
  comparison: 'min-h-10 w-full px-3 text-xs',
  sticky: 'min-h-11 px-4 text-sm',
  hero: 'min-h-11 px-5 text-sm sm:text-base',
  'mobile-footer': 'min-h-11 flex-1 px-3 text-sm',
};

export function QuoteCTA({
  companyId,
  _productId,
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

  return (
    <Button
      type="button"
      aria-label="Solicitar orçamento"
      disabled={loading || disabled}
      onClick={handleRequest}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 font-semibold leading-tight text-white transition-colors hover:bg-blue-700',
        'whitespace-nowrap',
        contextClasses[context],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="hidden min-[380px]:inline">Solicitar orçamento</span>
      <span className="inline min-[380px]:hidden">{shortLabel}</span>
    </Button>
  );
}
