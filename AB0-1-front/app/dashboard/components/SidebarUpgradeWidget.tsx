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
 * SidebarUpgradeWidget — reproduz o padrão compacto do my.G2 com a identidade Avalia Solar.
 * Suporta modo expandido (240px) e modo compacto rail (112px com tooltip acessível).
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
              aria-label="Desbloqueie seu potencial: conhecer planos"
              className={cn(
                'group mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[#FBBF24]',
                'bg-[#FFFBEB] p-1.5 shadow-sm transition-all duration-150',
                'hover:bg-[#FEF3C7] hover:scale-105 active:scale-95',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500',
                'dark:bg-[#15243B] dark:border-[#F59E0B] dark:hover:bg-[#22334D]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'motion-reduce:transition-none motion-reduce:hover:scale-100',
                className
              )}
            >
              <Image
                src="/upgrade-assets/lock-sparkles.svg"
                width={28}
                height={28}
                alt=""
                className="shrink-0 transition-transform duration-150 group-hover:rotate-3 motion-reduce:transition-none"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="z-50 border border-slate-700 bg-slate-900 text-xs text-white shadow-lg"
          >
            <p className="font-semibold">Desbloqueie seu potencial</p>
            <p className="text-[11px] text-amber-300">Conhecer planos</p>
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
      aria-label="Desbloqueie seu potencial: conhecer planos"
      className={cn(
        'group flex min-h-[56px] w-full items-center gap-3 rounded-lg border border-[#FBBF24]',
        'bg-[#FFFBEB] px-3.5 py-2.5 text-left shadow-sm transition-all duration-150',
        'hover:bg-[#FEF3C7] active:scale-[0.99]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500',
        'dark:bg-[#15243B] dark:border-[#F59E0B] dark:hover:bg-[#22334D]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        className
      )}
    >
      <div className="relative shrink-0">
        <Image
          src="/upgrade-assets/lock-sparkles.svg"
          width={36}
          height={36}
          alt=""
          className="shrink-0 transition-transform duration-150 group-hover:rotate-6 motion-reduce:transition-none"
        />
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-xs font-semibold text-[#111827] dark:text-white">
          Desbloqueie seu potencial
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#6366F1] dark:text-indigo-400 group-hover:underline">
          <span>Conhecer planos</span>
          <Image
            src="/upgrade-assets/arrow-up-right.svg"
            width={13}
            height={13}
            alt=""
            className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          />
        </span>
      </div>
    </button>
  );
}
