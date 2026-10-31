'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, List, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LeadsMapToolbarProps {
  onFitBounds: () => void;
  onSwitchView?: (view: 'list' | 'kanban') => void;
  municipalitiesCount: number;
  className?: string;
}

export const LeadsMapToolbar: React.FC<LeadsMapToolbarProps> = ({
  onFitBounds,
  onSwitchView,
  municipalitiesCount,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs ${className}`}
      data-testid="leads-map-toolbar"
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onFitBounds}
          className="h-8 px-2.5 text-xs font-semibold rounded-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          data-testid="leads-map-fit-bounds-button"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Enquadrar Municípios</span>
        </Button>

        {onSwitchView && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onSwitchView('list')}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            data-testid="leads-map-switch-list-button"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ver Lista</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/80 cursor-help">
                <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="hidden md:inline">Centroide aproximado</span>
                <span className="md:hidden">Aproximado</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs font-medium">
              Os pins representam a posição central (centroide) do município da conta comercial. Não constituem endereço exato do projeto nem requerem GPS individual.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
          {municipalitiesCount} {municipalitiesCount === 1 ? 'cidade' : 'cidades'}
        </span>
      </div>
    </div>
  );
};

