'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Calculator,
  Info,
  Users,
  CircleDollarSign,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Company, CompanyFinancingProfile } from '@/lib/api';
import { simulateFinancing, AmortizationType } from '@/lib/financing';
import { getFullImageUrl } from '@/utils/image';
import FinancingSimulationModal from './FinancingSimulationModal';

interface FinancingInlineCardProps {
  company: Company;
}

const formatCurrency = (value: number, curr: string = 'BRL') => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeCurr = typeof curr === 'string' && curr.length === 3 ? curr.toUpperCase() : 'BRL';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: safeCurr }).format(
      safeValue
    );
  } catch {
    return `R$ ${safeValue.toFixed(2)}`;
  }
};

const formatShortCurrency = (val: number) => {
  if (val >= 1000000) {
    const millions = val / 1000000;
    return `R$ ${millions % 1 === 0 ? millions : millions.toFixed(1)} milhão`;
  }
  if (val >= 1000) {
    const thousands = val / 1000;
    return `R$ ${thousands % 1 === 0 ? thousands : thousands.toFixed(0)} mil`;
  }
  return `R$ ${val.toFixed(0)}`;
};

export default function FinancingInlineCard({ company }: FinancingInlineCardProps) {
  const profile = company.financing_profile;
  const currency = profile?.currency || 'BRL';

  // Configurações padrão derivadas do perfil real da empresa
  const defaultAmount = profile?.default_amount_cents
    ? profile.default_amount_cents / 100
    : 50000;
  const minAmount = profile?.min_amount_cents
    ? profile.min_amount_cents / 100
    : 5000;
  const maxAmount = profile?.max_amount_cents
    ? profile.max_amount_cents / 100
    : 1000000;

  const defaultDownPayment = profile?.default_down_payment_percent ?? 20;
  const minDownPayment = profile?.min_down_payment_percent ?? 0;
  const maxDownPayment = profile?.max_down_payment_percent ?? 80;

  const defaultTerm = profile?.default_term_months ?? 60;
  const minTerm = profile?.min_term_months ?? 12;
  const maxTerm = profile?.max_term_months ?? 120;

  const interestRate = profile?.default_interest_rate_monthly ?? 1.192;
  const amortizationType = (profile?.amortization_type as AmortizationType) || 'price';

  // Estados locais dos controles
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(defaultDownPayment);
  const [termMonths, setTermMonths] = useState<number>(defaultTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tratamento do input monetário formatado
  const [displayAmountText, setDisplayAmountText] = useState<string>(
    formatCurrency(defaultAmount, currency)
  );
  const [isAmountEditing, setIsAmountEditing] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const numVal = Number(rawVal) / 100;
    setAmount(numVal);
    setDisplayAmountText(e.target.value);
  };

  const handleAmountBlur = () => {
    setIsAmountEditing(false);
    let clamped = amount;
    if (clamped < minAmount) clamped = minAmount;
    if (clamped > maxAmount) clamped = maxAmount;
    setAmount(clamped);
    setDisplayAmountText(formatCurrency(clamped, currency));
  };

  const handleAmountFocus = () => {
    setIsAmountEditing(true);
    setDisplayAmountText(amount > 0 ? (amount * 100).toString() : '');
  };

  // Cálculo da entrada
  const downPaymentValue = (amount * downPaymentPercent) / 100;

  // Cálculo da simulação em tempo real
  const simulation = useMemo(() => {
    return simulateFinancing({
      amount,
      downPaymentPercent,
      termMonths,
      interestRateMonthly: interestRate,
      graceMonths: profile?.grace_months_enabled ? (profile.max_grace_months || 0) : 0,
      amortizationType,
    });
  }, [amount, downPaymentPercent, termMonths, interestRate, profile, amortizationType]);

  // Lista de prazos disponíveis para o Select
  const availableTerms = useMemo(() => {
    const terms = [12, 24, 36, 48, 60, 72, 84, 96, 120];
    return terms.filter((t) => t >= minTerm && t <= maxTerm);
  }, [minTerm, maxTerm]);

  // 4 Pilares informativos reais do rodapé
  const targetAudienceLabel = useMemo(() => {
    return 'Pessoa Física, Pessoa Jurídica e Rural';
  }, []);

  const valuesRangeLabel = useMemo(() => {
    return `De ${formatShortCurrency(minAmount)} a ${formatShortCurrency(maxAmount)}`;
  }, [minAmount, maxAmount]);

  const gracePeriodLabel = useMemo(() => {
    if (profile?.grace_months_enabled && profile.max_grace_months) {
      return `Até ${profile.max_grace_months} meses`;
    }
    return 'Conforme a linha de crédito';
  }, [profile]);

  const termRangeLabel = useMemo(() => {
    return `Até ${maxTerm} meses`;
  }, [maxTerm]);

  // Logo da instituição
  const logoSrc = company.logo_url || (company as any).logo;
  const logoUrl = logoSrc ? getFullImageUrl(logoSrc) : null;
  const isBancoDoBrasil = /banco do brasil|bb/i.test(company.name);

  return (
    <>
      <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            {/* Avatar circular exclusivo do bloco financeiro (US-011) */}
            <div
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border shadow-xs flex items-center justify-center ${
                isBancoDoBrasil ? 'bg-[#FCDE00] border-amber-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={company.name}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <span className="text-base font-black text-slate-800">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
                {profile?.title || 'Simule seu financiamento solar'}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                {profile?.subtitle ||
                  'Defina o valor do projeto, entrada e prazo para ver a parcela estimada em tempo real.'}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-xs font-semibold px-2.5 py-0.5 text-slate-600 border-slate-200 bg-slate-50 shrink-0"
          >
            {currency}
          </Badge>
        </div>

        {/* Linha dos Controles + Card de Parcela (Grid Horizontal no Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start pt-5">
          {/* Controle 1: Valor do projeto */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">
              Valor do projeto
            </label>
            <div className="relative">
              <Input
                type="text"
                value={isAmountEditing ? displayAmountText : formatCurrency(amount, currency)}
                onChange={handleAmountChange}
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
                className="h-11 pr-10 font-bold text-slate-800 border-slate-200 rounded-xl focus-visible:ring-blue-600"
              />
              <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400">
              Min: {formatShortCurrency(minAmount)} • Max: {formatShortCurrency(maxAmount)}
            </p>
          </div>

          {/* Controle 2: Entrada (opcional) */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">
              Entrada (opcional)
            </label>
            <div className="h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800">
              {downPaymentPercent}%
            </div>
            <Slider
              value={[downPaymentPercent]}
              min={minDownPayment}
              max={maxDownPayment}
              step={1}
              onValueChange={(val) => setDownPaymentPercent(val[0])}
              className="mt-2"
            />
            <div className="text-xs font-medium text-slate-500 pt-0.5">
              {formatCurrency(downPaymentValue, currency)}
            </div>
          </div>

          {/* Controle 3: Prazo */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">
              Prazo
            </label>
            <Select
              value={termMonths.toString()}
              onValueChange={(val) => setTermMonths(Number(val))}
            >
              <SelectTrigger className="h-11 font-bold text-slate-800 border-slate-200 rounded-xl">
                <SelectValue placeholder="Selecione o prazo" />
              </SelectTrigger>
              <SelectContent>
                {availableTerms.map((term) => (
                  <SelectItem key={term} value={term.toString()} className="font-medium">
                    {term} meses
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Slider
              value={[termMonths]}
              min={minTerm}
              max={maxTerm}
              step={12}
              onValueChange={(val) => setTermMonths(val[0])}
              className="mt-2"
            />
            <div className="text-xs font-medium text-slate-500 pt-0.5">
              {termMonths} meses
            </div>
          </div>

          {/* Card de Resultado: Parcela estimada & CTA */}
          <div className="md:col-span-3 rounded-2xl bg-slate-50/90 border border-slate-100 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Parcela estimada
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-2xl md:text-3xl font-black text-blue-600 tracking-tight">
                  {formatCurrency(simulation.monthlyPayment, currency)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Informações sobre o cálculo da parcela"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs p-3">
                      <p className="font-semibold text-slate-900 mb-1">Premissas do cálculo:</p>
                      <ul className="space-y-1 text-slate-600">
                        <li>• Taxa de referência: {interestRate.toFixed(2)}% ao mês</li>
                        <li>• Sistema de amortização: {amortizationType.toUpperCase()}</li>
                        <li>• Valor financiado: {formatCurrency(simulation.financedAmount, currency)}</li>
                        <li>• Total estimado: {formatCurrency(simulation.totalPaid, currency)}</li>
                      </ul>
                      <p className="mt-2 text-[10px] text-slate-400 italic">
                        Valores sujeitos a alteração e análise cadastral.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-3 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              Simular financiamento
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rodapé com 4 Pilares Informativos de Crédito (Idêntico ao mock) */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Pilar 1: Público atendido */}
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Público atendido
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                {targetAudienceLabel}
              </span>
            </div>
          </div>

          {/* Pilar 2: Valores do financiamento */}
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CircleDollarSign className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Valores do financiamento
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                {valuesRangeLabel}
              </span>
            </div>
          </div>

          {/* Pilar 3: Carência */}
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Carência
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                {gracePeriodLabel}
              </span>
            </div>
          </div>

          {/* Pilar 4: Prazo */}
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Prazo
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                {termRangeLabel}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de simulação / proposta completa */}
      <FinancingSimulationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        company={company}
        amount={amount}
        downPaymentPercent={downPaymentPercent}
        termMonths={termMonths}
        interestRateMonthly={interestRate}
        simulation={simulation}
        currency={currency}
      />
    </>
  );
}
