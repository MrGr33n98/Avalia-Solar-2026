'use client';

import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

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
}

export default function DecisionChips({
  chips,
  onChipToggle,
  onChipRemove,
}: DecisionChipsProps) {
  return (
    <div className="bg-white border-b border-slate-200 py-4 px-4">
      <div className="container mx-auto">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filtros Rápidos:
          </span>

          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onChipToggle(chip.id)}
              className="flex items-center gap-1.5"
            >
              <Badge
                variant={chip.active ? 'default' : 'secondary'}
                className={`cursor-pointer transition-all ${
                  chip.active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {chip.label}
                {chip.active && chip.removable && (
                  <X
                    className="w-3 h-3 ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChipRemove(chip.id);
                    }}
                  />
                )}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
