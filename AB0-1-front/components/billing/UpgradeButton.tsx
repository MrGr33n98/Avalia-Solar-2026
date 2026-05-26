'use client';

import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function UpgradeButton({
  onClick,
  disabled = false,
  isLoading = false,
  className = '',
}: UpgradeButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="sm"
      className={[
        'bg-brand-green hover:bg-brand-green/90 text-white font-semibold rounded-full',
        'h-10 px-5 text-xs border-0 shadow-lg shadow-brand-green/20 transition-all flex items-center gap-1.5',
        className,
      ].join(' ')}
    >
      {isLoading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <Zap className="h-3.5 w-3.5 shrink-0 fill-current" />
      )}
      <span>Fazer Upgrade para Pro</span>
    </Button>
  );
}
