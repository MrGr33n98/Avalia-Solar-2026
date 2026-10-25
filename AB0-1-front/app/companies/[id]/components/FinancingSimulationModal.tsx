'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Company, CompanyFinancingProfile } from '@/lib/api';
import { FinancingSimulationResult } from '@/lib/financing';
import { ExternalLink, CheckCircle2, ShieldCheck, Info, Sparkles, Building2, User, Tractor } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';

interface FinancingSimulationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  amount: number;
  downPaymentPercent: number;
  termMonths: number;
  interestRateMonthly: number;
  simulation: FinancingSimulationResult;
  currency?: string;
}

const formatCurrency = (value: number, curr: string = 'BRL') => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeCurr = typeof curr === 'string' && curr.length === 3 ? curr.toUpperCase() : 'BRL';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: safeCurr }).format(safeValue);
  } catch {
    return `R$ ${safeValue.toFixed(2)}`;
  }
};

export default function FinancingSimulationModal({
  open,
  onOpenChange,
  company,
  amount,
  downPaymentPercent,
  termMonths,
  interestRateMonthly,
  simulation,
  currency = 'BRL',
}: FinancingSimulationModalProps) {
  const profile = company.financing_profile;
  const [selectedAudience, setSelectedAudience] = useState<'PF' | 'PJ' | 'Rural'>('PF');

  const logoSrc = company.logo_url || (company as any).logo;
  const logoUrl = logoSrc ? getFullImageUrl(logoSrc) : null;
  const downPaymentAmount = (amount * downPaymentPercent) / 100;

  const officialUrl =
    profile?.cta_url ||
    (company as any)?.website ||
    (company as any)?.whatsapp_url ||
    company.whatsapp ||
    null;

  const ctaLabel = profile?.cta_label || `Prosseguir no ${company.name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg md:max-w-xl p-0 overflow-hidden border-slate-200">
        <DialogHeader className="p-6 pb-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm flex items-center justify-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={company.name}
                  fill
                  className="object-contain p-1.5"
                />
              ) : (
                <span className="font-bold text-slate-700 text-lg">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Simulação de Financiamento Solar
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Proposta preliminar para {company.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Box de Resumo Financeiro */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">Parcela mensal estimada</span>
              <Badge variant="outline" className="text-[11px] font-semibold text-blue-700 bg-white border-blue-200">
                {termMonths} parcelas
              </Badge>
            </div>
            <div className="text-3xl font-black text-blue-700 tracking-tight">
              {formatCurrency(simulation.monthlyPayment, currency)}
              <span className="text-xs font-normal text-slate-500 ml-1.5">/mês</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100/80 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[11px]">Valor do projeto:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(amount, currency)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Entrada ({downPaymentPercent}%):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(downPaymentAmount, currency)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Valor financiado:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(simulation.financedAmount, currency)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Taxa estimada:</span>
                <span className="font-semibold text-slate-800">{interestRateMonthly.toFixed(2)}% a.m.</span>
              </div>
            </div>
          </div>

          {/* Seleção do Perfil / Público */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Selecione seu perfil
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAudience('PF')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                  selectedAudience === 'PF'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <User className="h-4 w-4" />
                <span className="text-xs">Pessoa Física</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAudience('PJ')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                  selectedAudience === 'PJ'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span className="text-xs">Pessoa Jurídica</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAudience('Rural')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                  selectedAudience === 'Rural'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Tractor className="h-4 w-4" />
                <span className="text-xs">Produtor Rural</span>
              </button>
            </div>
          </div>

          {/* Aviso Legal de Transparência */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 text-slate-500 text-xs border border-slate-100">
            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {profile?.disclaimer ||
                'Esta simulação é uma estimativa preliminar baseada nas condições vigentes e não representa aprovação prévia de crédito. A contratação está sujeita à análise cadastral e conformidade com as regras da instituição financeira.'}
            </p>
          </div>

          {/* Ações / CTA */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {officialUrl ? (
              <Button
                asChild
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm gap-2"
              >
                <a href={officialUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {ctaLabel}
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm"
                onClick={() => onOpenChange(false)}
              >
                Concluir Simulação
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-11 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
