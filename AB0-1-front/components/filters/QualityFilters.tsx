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
    <div className="space-y-2 pt-2">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
        Qualidade e Facilidades
      </h4>
      {filters.map((filter) => {
        const Icon = filter.icon;
        return (
          <div 
            key={filter.id}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer group ${
              filter.value 
                ? 'bg-blue-50 border-blue-100' 
                : 'border-transparent hover:bg-slate-50'
            }`}
            onClick={() => onChange(filter.id, !filter.value)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${
                filter.value ? 'bg-white text-blue-700 shadow-sm' : 'bg-slate-100 text-slate-500'
              }`}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-semibold transition-colors ${
                  filter.value ? 'text-blue-700' : 'text-slate-700'
                }`}>
                  {filter.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {filter.description}
                </span>
              </div>
            </div>
            <Switch
              checked={filter.value}
              onCheckedChange={(val) => onChange(filter.id, val)}
              className="data-[state=checked]:bg-blue-600"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })}
    </div>
  );
};
