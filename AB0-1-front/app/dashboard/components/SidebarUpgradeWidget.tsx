'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarUpgradeWidgetProps {
  onOpenPlans: () => void;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * SidebarUpgradeWidget — padrão compacto com tokens Astryx semânticos.
 */
export function SidebarUpgradeWidget({
  onOpenPlans,
  compact = false,
  className,
  disabled = false,
}: SidebarUpgradeWidgetProps) {
  if (compact) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenPlans}
              disabled={disabled}
              aria-label="Conhecer planos empresariais"
              className={cn(
                'group mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--dashboard-border))]',
                'bg-[hsl(var(--dashboard-panel))] p-1.5 shadow-xs transition-colors',
                'hover:bg-[hsl(var(--dashboard-surface))] active:scale-95',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--dashboard-accent))]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
              )}
            >
              <Image
                src="/upgrade-assets/lock-sparkles.svg"
                width={24}
                height={24}
                alt=""
                className="shrink-0 transition-transform duration-150 group-hover:rotate-3 motion-reduce:transition-none"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="z-50 border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-xs text-[hsl(var(--dashboard-ink))] shadow-md"
          >
            <p className="font-semibold">Planos Empresariais</p>
            <p className="text-[11px] text-[hsl(var(--dashboard-accent))]">Conhecer planos</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenPlans}
      disabled={disabled}
      aria-label="Conhecer planos empresariais"
      className={cn(
        'group flex min-h-[52px] w-full items-center gap-3 rounded-lg border border-[hsl(var(--dashboard-border))]',
        'bg-[hsl(var(--dashboard-panel))] px-3.5 py-2 text-left shadow-xs transition-colors',
        'hover:bg-[hsl(var(--dashboard-surface))] active:scale-[0.99]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--dashboard-accent))]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      <div className="relative shrink-0">
        <Image
          src="/upgrade-assets/lock-sparkles.svg"
          width={32}
          height={32}
          alt=""
          className="shrink-0 transition-transform duration-150 group-hover:rotate-6 motion-reduce:transition-none"
        />
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-xs font-semibold text-[hsl(var(--dashboard-ink))]">
          Plano Empresarial
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-[hsl(var(--dashboard-accent))] group-hover:underline">
          <span>Conhecer planos</span>
          <Image
            src="/upgrade-assets/arrow-up-right.svg"
            width={12}
            height={12}
            alt=""
            className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          />
        </span>
      </div>
    </button>
  );
}

export default SidebarUpgradeWidget;
