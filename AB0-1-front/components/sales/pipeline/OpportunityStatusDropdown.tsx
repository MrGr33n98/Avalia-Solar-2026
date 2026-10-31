'use client';

import React, { useState } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  OpportunityStatusKey,
  STATUS_LIST,
  getStatusConfig,
  normalizeOpportunityStatus,
} from './opportunityStatusUtils';
import { salesApi } from '@/lib/api/sales/client';

export interface OpportunityStatusDropdownProps {
  status?: string | null;
  isHot?: boolean;
  variant?: 'card' | 'summary' | 'badge';
  opportunityId?: number;
  opportunityName?: string;
  disabled?: boolean;
  onStatusChange?: (newStatus: OpportunityStatusKey) => void | Promise<void>;
  onOpenLostDialog?: () => void;
  className?: string;
}

export const OpportunityStatusDropdown: React.FC<OpportunityStatusDropdownProps> = ({
  status = 'open',
  isHot = false,
  variant = 'card',
  opportunityId,
  opportunityName,
  disabled = false,
  onStatusChange,
  onOpenLostDialog,
  className = '',
}) => {
  const [currentStatus, setCurrentStatus] = useState<OpportunityStatusKey>(
    normalizeOpportunityStatus(status)
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state if external prop changes
  React.useEffect(() => {
    setCurrentStatus(normalizeOpportunityStatus(status));
  }, [status]);

  const activeConfig = getStatusConfig(currentStatus, isHot);
  const ActiveIcon = activeConfig.icon;

  const handleSelectStatus = async (newKey: OpportunityStatusKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newKey === currentStatus || disabled || isUpdating) return;

    if (newKey === 'lost' && onOpenLostDialog) {
      onOpenLostDialog();
      return;
    }

    const previousStatus = currentStatus;
    setCurrentStatus(newKey);
    setIsUpdating(true);

    try {
      if (onStatusChange) {
        await onStatusChange(newKey);
      } else if (opportunityId) {
        if (newKey === 'won') {
          await salesApi.markOpportunityWon(opportunityId);
        } else {
          await salesApi.updateOpportunity(opportunityId, { status: newKey });
        }
      }
    } catch (err: unknown) {
      // Rollback on failure
      setCurrentStatus(previousStatus);
      console.error('[OpportunityStatusDropdown] Falha ao atualizar status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 1. Variant: CARD (Compact icon for Kanban Lead Card)
  if (variant === 'card') {
    return (
      <TooltipProvider delayDuration={300}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger
                asChild
                disabled={disabled || isUpdating}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  data-testid={`opportunity-status-card-trigger-${opportunityId ?? 'generic'}`}
                  aria-label={
                    opportunityName
                      ? `Status de ${opportunityName}: ${activeConfig.label}. Clique para alterar.`
                      : `Status: ${activeConfig.label}. Clique para alterar.`
                  }
                  className={`group/status relative inline-flex items-center justify-center rounded-md p-1 transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${className}`}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                  ) : (
                    <ActiveIcon
                      className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover/status:scale-110 ${activeConfig.iconColorClass} ${activeConfig.fillColorClass || ''}`}
                    />
                  )}
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-semibold">
              <span className="font-bold">{activeConfig.label}</span>: {activeConfig.description}
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            align="start"
            className="w-48 p-1 shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_LIST.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = item.key === currentStatus;
              return (
                <DropdownMenuItem
                  key={item.key}
                  data-testid={`opportunity-status-item-${item.key}`}
                  onClick={(e) => handleSelectStatus(item.key, e)}
                  className={`flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ItemIcon
                      className={`h-4 w-4 shrink-0 ${item.iconColorClass} ${item.fillColorClass || ''}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  // 2. Variant: SUMMARY (For Opportunity 360 View Sidebar, Benchmark Nutshell Image 1)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        disabled={disabled || isUpdating}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-testid={`opportunity-status-summary-trigger-${opportunityId ?? 'generic'}`}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          } ${className}`}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <ActiveIcon
              className={`h-4 w-4 shrink-0 ${activeConfig.iconColorClass} ${activeConfig.fillColorClass || ''}`}
            />
          )}
          <span className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500 font-extrabold text-slate-800 dark:text-slate-200">
            {activeConfig.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-52 p-1.5 shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {STATUS_LIST.map((item) => {
          const ItemIcon = item.icon;
          const isSelected = item.key === currentStatus;
          return (
            <DropdownMenuItem
              key={item.key}
              data-testid={`opportunity-status-summary-item-${item.key}`}
              onClick={(e) => handleSelectStatus(item.key, e)}
              className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-sky-50 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200 font-extrabold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ItemIcon
                  className={`h-4 w-4 shrink-0 ${item.iconColorClass} ${item.fillColorClass || ''}`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
