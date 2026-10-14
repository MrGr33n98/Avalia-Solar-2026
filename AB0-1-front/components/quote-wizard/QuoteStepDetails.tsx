'use client';

import React, { useState } from 'react';
import {
  Zap,
  Calendar,
  MapPin,
  ChevronDown,
  FileText,
  Loader2,
  Building,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type WizardFormState } from './types';

interface QuoteStepDetailsProps {
  form: WizardFormState;
  onUpdate: (patch: Partial<WizardFormState>) => void;
  onLookupZipcode: () => Promise<void>;
  isLookingUpZipcode?: boolean;
}

export function QuoteStepDetails({
  form,
  onUpdate,
  onLookupZipcode,
  isLookingUpZipcode = false,
}: QuoteStepDetailsProps) {
  const isEvCharging = form.productVertical.toLowerCase().includes('carregador') ||
    form.quoteType.toLowerCase().includes('ev');

  const [showNotes, setShowNotes] = useState(Boolean(form.notes));

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Campo 1: Consumo ou Potência de Recarga */}
      <div className="space-y-1">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {isEvCharging ? 'Capacidade de Recarga Estimada' : 'Faixa de Consumo de Energia'}
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-[11px] text-slate-400 pointer-events-none">
            <Zap className="h-4 w-4" />
          </div>
          <select
            value={form.billValue}
            onChange={(e) => onUpdate({ billValue: e.target.value })}
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            aria-label={isEvCharging ? 'Capacidade de recarga' : 'Consumo mensal de energia'}
          >
            <option value="" disabled>
              {isEvCharging ? 'Selecione a capacidade desejada' : 'Média mensal na conta de luz'}
            </option>
            {isEvCharging ? (
              <>
                <option value="Wallbox Residencial (até 7,4 kW)">Wallbox Residencial (até 7,4 kW)</option>
                <option value="Comercial / Semirrápido (11 kW a 22 kW)">Comercial / Semirrápido (11 kW a 22 kW)</option>
                <option value="Estação DC Rápida / Frotas">Estação DC Rápida / Frotas</option>
                <option value="Nao sei">Não sei informar</option>
              </>
            ) : (
              <>
                <option value="Ate R$ 300">Até R$ 300/mês</option>
                <option value="R$ 300 a R$ 500">R$ 300 a R$ 500/mês</option>
                <option value="R$ 500 a R$ 1.000">R$ 500 a R$ 1.000/mês</option>
                <option value="Acima de R$ 1.000">Acima de R$ 1.000/mês</option>
                <option value="Nao sei">Não sei informar</option>
              </>
            )}
          </select>
          <div className="absolute right-3 top-[11px] pointer-events-none text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Grid 2 Colunas: Tipo de Instalação & Prazo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Tipo de Instalação */}
        <div className="space-y-1">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Tipo de Instalação
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-[11px] text-slate-400 pointer-events-none">
              <Building className="h-4 w-4" />
            </div>
            <select
              value={form.installationType || 'Telhado Ceramico'}
              onChange={(e) => onUpdate({ installationType: e.target.value })}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              aria-label="Tipo de instalação"
            >
              <option value="Telhado Ceramico">Telhado Cerâmico</option>
              <option value="Telhado Metalico">Telhado Metálico</option>
              <option value="Laje">Laje plana</option>
              <option value="Solo">Solo</option>
              <option value="Garagem / Estacionamento">Garagem / Vaga</option>
              <option value="Outro">Outro</option>
            </select>
            <div className="absolute right-3 top-[11px] pointer-events-none text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Prazo Desejado */}
        <div className="space-y-1">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Prazo de Decisão
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-[11px] text-slate-400 pointer-events-none">
              <Calendar className="h-4 w-4" />
            </div>
            <select
              value={form.decisionTimeline || 'Agora'}
              onChange={(e) => onUpdate({ decisionTimeline: e.target.value })}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              aria-label="Prazo desejado"
            >
              <option value="Agora">O mais rápido possível</option>
              <option value="Em até 6 meses">Em até 6 meses</option>
              <option value="Mais de 6 meses">Ainda estou pesquisando</option>
            </select>
            <div className="absolute right-3 top-[11px] pointer-events-none text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Localização (CEP ou Cidade/UF) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Local da Instalação
          </Label>
          {isLookingUpZipcode && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Buscando endereço...</span>
            </span>
          )}
        </div>
        <div className="relative">
          <div className="absolute left-3 top-[11px] text-slate-400 pointer-events-none">
            <MapPin className="h-4 w-4" />
          </div>
          <Input
            value={form.zipcode}
            onChange={(e) => {
              const val = e.target.value;
              onUpdate({ zipcode: val });
              if (val.replace(/\D/g, '').length === 8) {
                void onLookupZipcode();
              }
            }}
            onBlur={() => {
              if (form.zipcode.replace(/\D/g, '').length === 8) {
                void onLookupZipcode();
              }
            }}
            placeholder="Digite seu CEP (Ex.: 01310-100) ou Cidade/UF"
            className="h-10 w-full rounded-xl border-slate-200 pl-9 text-xs focus:border-blue-500"
          />
        </div>
        {(form.city || form.addressStreet) && (
          <p className="text-[11px] text-slate-500 font-medium px-1">
            {[form.addressStreet, form.city, form.state].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Observações Opcionais em Disclosure para Economia de Altura */}
      <div className="pt-1">
        {!showNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>+ Adicionar observações adicionais</span>
          </button>
        ) : (
          <div className="space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Observações Adicionais (opcional)
              </Label>
              <button
                type="button"
                onClick={() => {
                  setShowNotes(false);
                  onUpdate({ notes: '' });
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Ocultar
              </button>
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Ex: Instalação trifásica, telhado voltado para o norte..."
              className="min-h-[56px] max-h-[80px] w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500 resize-none font-medium text-slate-800"
            />
          </div>
        )}
      </div>
    </div>
  );
}
