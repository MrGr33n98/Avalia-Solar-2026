'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ManageSubscriptionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ManageSubscriptionButton({
  onClick,
  disabled = false,
  isLoading = false,
}: ManageSubscriptionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="sm"
      className="clay-chip rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold h-10 px-5 shadow-sm transition-all"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          Carregando portal...
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          Gerenciar Assinatura no Stripe
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </span>
      )}
    </Button>
  );
}
