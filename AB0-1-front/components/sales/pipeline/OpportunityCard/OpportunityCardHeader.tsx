'use client';

import React from 'react';
import { Building2, Flame, ThermometerSnowflake, Zap } from 'lucide-react';
import { PipelineCardDTO } from './OpportunityCard.types';

interface HeaderProps {
  card: PipelineCardDTO;
  selected: boolean;
  onToggleSelect: (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => void;
}

export const OpportunityCardHeader: React.FC<HeaderProps> = ({ card, selected, onToggleSelect }) => {
  const companyName = card.account?.name || card.name || 'Empresa não informada';

  const renderTemperatureBadge = () => {
    if (card.temperature === 'hot') {
      return (
        <span
          className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300"
          title="Lead Quente / Alta Temperatura"
        >
          <Flame className="h-3 w-3 fill-red-500 text-red-500" />
          HOT
        </span>
      );
    }
    if (card.temperature === 'warm') {
      return (
        <span
          className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          title="Lead Morno / Média Temperatura"
        >
          <Zap className="h-3 w-3 text-amber-600 fill-amber-500" />
          WARM
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        title="Lead Frio"
      >
        <ThermometerSnowflake className="h-3 w-3 text-slate-400" />
        COLD
      </span>
    );
  };

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(e);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
          aria-label={`Selecionar oportunidade ${companyName}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <h4
              className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100"
              title={companyName}
            >
              {companyName}
            </h4>
          </div>
          {card.name && card.name !== companyName && (
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {card.name}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{renderTemperatureBadge()}</div>
    </div>
  );
};
