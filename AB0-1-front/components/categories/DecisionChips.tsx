'use client';

import { Building2, MapPin, RotateCcw, ShieldCheck, SlidersHorizontal, Star } from 'lucide-react';

interface Chip {
  id: string;
  label: string;
  active: boolean;
  removable?: boolean;
}

interface DecisionChipsProps {
  chips: Chip[];
  onChipToggle: (chipId: string) => void;
  onChipRemove: (chipId: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

const CHIP_ICONS = {
  verified: ShieldCheck,
  rated: Star,
  my_state: MapPin,
  industrial: Building2,
};

function getChipIcon(chipId: string) {
  return CHIP_ICONS[chipId as keyof typeof CHIP_ICONS] || SlidersHorizontal;
}

export default function DecisionChips({
  chips,
  onChipToggle,
  onClearFilters,
  hasActiveFilters = false,
}: DecisionChipsProps) {
  return (
    <section className="bg-white py-3">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-black uppercase tracking-wide text-slate-600 sm:text-xs">
            Filtros rápidos
          </h2>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition-colors enabled:hover:text-blue-700 disabled:opacity-60 sm:text-xs"
          >
            Limpar filtros
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {chips.map((chip) => {
            const Icon = getChipIcon(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipToggle(chip.id)}
                className={`flex h-9 min-w-0 items-center justify-center gap-1 rounded-lg border px-1 text-[9px] font-bold shadow-sm transition-all sm:h-11 sm:gap-1.5 sm:px-3 sm:text-xs ${
                  chip.active
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${chip.id === 'rated' ? 'fill-amber-400 text-amber-400' : ''}`}
                />
                <span className="truncate">{chip.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="flex h-9 min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1 text-[9px] font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/60 sm:h-11 sm:gap-1.5 sm:px-3 sm:text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-blue-600 sm:h-4 sm:w-4" />
            <span className="truncate">Mais filtros</span>
          </button>
        </div>
      </div>
    </section>
  );
}
