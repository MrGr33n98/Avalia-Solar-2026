'use client';

import React from 'react';
import { Tag, Info, Check } from 'lucide-react';
import { BrandCatalogCombobox } from '@/components/review-dashboard/brands/BrandCatalogCombobox';
import type { BrandCatalogItem } from '@/lib/api/brands';
import type { BrandUsageContext } from '@/lib/api/reviewer-brand-usages';

export interface ReviewBrandUsageOptInData {
  optIn: boolean;
  brand: BrandCatalogItem | null;
  usageContext: BrandUsageContext;
}

export interface ReviewBrandUsageOptInStepProps {
  data: ReviewBrandUsageOptInData;
  onChange: (data: ReviewBrandUsageOptInData) => void;
  companyName?: string;
}

const CONTEXT_OPTIONS: { value: BrandUsageContext; label: string }[] = [
  { value: 'integrator_install', label: 'Instalei como profissional / integrador' },
  { value: 'personal_owner', label: 'Uso pessoal / sou proprietário do sistema' },
  { value: 'designer_specification', label: 'Especifiquei em projeto técnico' },
  { value: 'maintenance', label: 'Realizei manutenção / O&M' },
];

export function ReviewBrandUsageOptInStep({
  data,
  onChange,
  companyName,
}: ReviewBrandUsageOptInStepProps) {
  const handleOptInChange = (choice: 'yes' | 'no' | 'later') => {
    if (choice === 'yes') {
      onChange({
        ...data,
        optIn: true,
      });
    } else {
      onChange({
        ...data,
        optIn: false,
        brand: null,
      });
    }
  };

  const handleBrandSelect = (brand: BrandCatalogItem | null) => {
    onChange({
      ...data,
      brand,
    });
  };

  const handleContextChange = (ctx: BrandUsageContext) => {
    onChange({
      ...data,
      usageContext: ctx,
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="review-brand-opt-in-step">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 text-[#17468D]">
          <Tag className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-snug">
            Vincular Fabricante ou Marca Utilizada (Opcional)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Você utilizou equipamentos de alguma marca solar específica nesta experiência com {companyName || 'a empresa'}?
          </p>
        </div>
      </div>

      {/* Opções Sim / Não / Agora não */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Opção de vínculo de marca">
        <button
          type="button"
          onClick={() => handleOptInChange('yes')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
            data.optIn
              ? 'border-[#17468D] bg-blue-50/70 text-[#17468D] ring-1 ring-[#17468D]'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          data-testid="opt-in-yes"
        >
          {data.optIn && <Check className="w-3.5 h-3.5" />}
          <span>Sim, desejo vincular</span>
        </button>

        <button
          type="button"
          onClick={() => handleOptInChange('no')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
            !data.optIn
              ? 'border-slate-300 bg-slate-100 text-slate-800'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
          data-testid="opt-in-no"
        >
          <span>Não utilizei marca específica</span>
        </button>

        <button
          type="button"
          onClick={() => handleOptInChange('later')}
          className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          data-testid="opt-in-later"
        >
          <span>Agora não</span>
        </button>
      </div>

      {/* Formulário condicional quando Sim */}
      {data.optIn && (
        <div className="pt-3 border-t border-slate-100 space-y-3.5 animate-fadeIn" data-testid="brand-selection-subform">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Fabricante do Equipamento *
            </label>
            <BrandCatalogCombobox
              value={data.brand}
              onSelect={handleBrandSelect}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Como você atuou com esta marca? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONTEXT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleContextChange(opt.value)}
                  className={`text-left p-2.5 rounded border text-xs transition-colors ${
                    data.usageContext === opt.value
                      ? 'border-[#17468D] bg-blue-50/50 text-[#17468D] font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aviso de conformidade e privacidade */}
          <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p>
              O vínculo será salvo como <strong>privado por padrão</strong> na sua Central do Avaliador com o status autodeclarado. A aprovação da sua avaliação pela moderação não certifica a marca automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
