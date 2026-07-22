'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IcpStateGridProps {
  selectedStates: string[];
  onChange: (states: string[]) => void;
  disabled?: boolean;
}

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function IcpStateGrid({
  selectedStates,
  onChange,
  disabled = false,
}: IcpStateGridProps) {
  const handleToggleState = (state: string) => {
    if (disabled) return;
    if (selectedStates.includes(state)) {
      onChange(selectedStates.filter((s) => s !== state));
    } else {
      onChange([...selectedStates, state]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange([...BRAZIL_STATES]);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#526071]">
          Estados de Atendimento ({selectedStates.length})
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled}
            className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-[#1F5EFF] hover:text-[#1749CC] hover:bg-[#EEF4FF] rounded-sm"
          >
            Selecionar Todos
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled}
            className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-[#C9362B] hover:bg-[#FFF1F0] rounded-sm"
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-9 lg:grid-cols-7 xl:grid-cols-9 gap-1.5">
        {BRAZIL_STATES.map((state) => {
          const isSelected = selectedStates.includes(state);
          return (
            <button
              key={state}
              type="button"
              onClick={() => handleToggleState(state)}
              disabled={disabled}
              className={cn(
                'h-10 min-w-[40px] text-xs font-black rounded-sm border transition-all flex items-center justify-center outline-none',
                'focus-visible:ring-1 focus-visible:ring-[#1F5EFF] focus-visible:border-[#1F5EFF]',
                isSelected
                  ? 'bg-[#EEF4FF] border-[#1F5EFF] text-[#0B1F3A]'
                  : 'bg-white border-[#D8DEE8] text-[#526071] hover:border-[#B8C2D1] hover:bg-[#F8FAFC]',
                disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
              )}
              aria-label={`Estado ${state}`}
              aria-pressed={isSelected}
            >
              {state}
            </button>
          );
        })}
      </div>
    </div>
  );
}
