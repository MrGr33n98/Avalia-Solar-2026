'use client';

import React from 'react';
import { ShieldCheck, Sparkles, BadgePercent, MessageCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface QualityFiltersProps {
  verified: boolean;
  featured: boolean;
  financing: boolean;
  whatsapp: boolean;
  onChange: (key: 'verified' | 'featured' | 'financing' | 'whatsapp', value: boolean) => void;
}

export const QualityFilters: React.FC<QualityFiltersProps> = ({
  verified,
  featured,
  financing,
  whatsapp,
  onChange,
}) => {
  const filters = [
    {
      id: 'verified',
      label: 'Apenas verificadas',
      description: 'Empresas com selo de confiança',
      icon: ShieldCheck,
      value: verified,
    },
    {
      id: 'featured',
      label: 'Destaques',
      description: 'Empresas em evidência',
      icon: Sparkles,
      value: featured,
    },
    {
      id: 'financing',
      label: 'Financiamento',
      description: 'Oferecem opções de crédito',
      icon: BadgePercent,
      value: financing,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      description: 'Atendimento via chat',
      icon: MessageCircle,
      value: whatsapp,
    },
  ] as const;

  return (
    <div className="border-b border-slate-200 py-4">
      <h4 className="mb-2 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Qualidade e Facilidades
      </h4>
      {filters.map((filter) => {
        const Icon = filter.icon;
        return (
          <div 
            key={filter.id}
            className={`group flex cursor-pointer items-center justify-between border-y border-transparent px-5 py-3 transition-colors ${
              filter.value 
                ? 'border-blue-100 bg-blue-50' 
                : 'hover:border-slate-200 hover:bg-slate-50'
            }`}
            onClick={() => onChange(filter.id, !filter.value)}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center border rounded-none transition-colors ${
                filter.value ? 'border-blue-200 bg-white text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium transition-colors ${
                  filter.value ? 'text-blue-700' : 'text-slate-700'
                }`}>
                  {filter.label}
                </span>
                <span className="text-xs text-slate-500">
                  {filter.description}
                </span>
              </div>
            </div>
            <Switch
              id={`filter-${filter.id}`}
              aria-label={filter.label}
              checked={filter.value}
              onCheckedChange={(val) => onChange(filter.id, val)}
              className="border border-slate-300 shadow-none data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })}
    </div>
  );
};
