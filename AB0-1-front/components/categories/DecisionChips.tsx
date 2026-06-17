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
    <section className="bg-white py-4">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-600">
            Filtros rápidos
          </h2>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors enabled:hover:text-blue-700 disabled:opacity-40"
          >
            Limpar filtros
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {chips.map((chip) => {
            const Icon = getChipIcon(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipToggle(chip.id)}
                className={`flex h-14 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-bold shadow-sm transition-all ${
                  chip.active
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${chip.id === 'rated' ? 'fill-amber-400 text-amber-400' : ''}`}
                />
                {chip.label}
              </button>
            );
          })}
          <button
            type="button"
            className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/60"
          >
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            Mais filtros
          </button>
        </div>
      </div>
    </section>
  );
}
