'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Home,
  Layers,
  MessageSquare,
  Scale,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { leadsApiSafe } from '@/lib/api-client';

export interface ProposalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSupplier?: string;
  targetCompanyId?: number;
  defaultPower?: string;
  onSubmitted?: () => Promise<void> | void;
  onSuccessNavigateChat?: (supplierName: string) => void;
  onSuccessNavigateCompare?: () => void;
  onSuccessNavigateHub?: () => void;
}

export function ProposalRequestModal({
  isOpen,
  onClose,
  targetSupplier = 'Empresas parceiras',
  targetCompanyId,
  defaultPower = '8,5',
  onSubmitted,
  onSuccessNavigateChat,
  onSuccessNavigateCompare,
  onSuccessNavigateHub,
}: ProposalRequestModalProps) {
  const [step, setStep] = useState<'form' | 'confirmed'>('form');
  const [wizardStep, setWizardStep] = useState<number>(2);
  const [desiredPower, setDesiredPower] = useState<string>(defaultPower);
  const [customPower, setCustomPower] = useState<string>('');
  const [installType, setInstallType] = useState<'Telhado' | 'Solo' | 'Carport'>('Telhado');
  const [needsFinancing, setNeedsFinancing] = useState<boolean>(true);
  const [requestNotes, setRequestNotes] = useState<string>(
    'Gostaria de incluir monitoramento por aplicativo e visita técnica gratuita.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const finalPower = desiredPower === 'Outro' ? customPower.trim() : desiredPower;
      await leadsApiSafe.create({
        company: targetSupplier && targetSupplier !== 'Empresas parceiras' ? targetSupplier : undefined,
        company_id: targetCompanyId,
        system_power: finalPower,
        property_type: installType,
        needs_financing: needsFinancing,
        message: requestNotes.trim(),
        product_vertical: 'solar_photovoltaic',
      });
      if (onSubmitted) {
        await onSubmitted();
      }
      setStep('confirmed');
    } catch (err: unknown) {
      console.error('[ProposalRequestModal] Falha ao enviar solicitação:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Não foi possível enviar a solicitação. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setWizardStep(2);
    setSubmitError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-5 overflow-y-auto flex flex-col justify-between">
        {step === 'form' ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Solicitar proposta personalizada
                </h2>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper 1 - 2 - 3 */}
            <div className="relative flex items-center justify-between px-3 pt-1">
              <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 -z-0" />
              {[
                { s: 1, label: '1. Projeto' },
                { s: 2, label: '2. Detalhes' },
                { s: 3, label: '3. Revisar' },
              ].map((item) => {
                const active = wizardStep === item.s;
                const done = wizardStep > item.s;
                return (
                  <button
                    key={item.s}
                    type="button"
                    onClick={() => setWizardStep(item.s)}
                    className="relative z-10 flex flex-col items-center bg-white px-2"
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition',
                        active || done
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-400'
                      )}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : item.s}
                    </div>
                    <span
                      className={cn(
                        'text-[11px] mt-1',
                        active
                          ? 'font-bold text-blue-600'
                          : done
                          ? 'font-medium text-slate-700'
                          : 'text-slate-400'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Título & Subtítulo */}
            <div className="space-y-0.5 pt-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Personalize sua solicitação
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ajuste as informações do seu projeto para enviar ao fornecedor{' '}
                <span className="font-semibold text-slate-700">({targetSupplier})</span>.
              </p>
            </div>

            {/* Potência desejada */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Potência desejada (kWp)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {['5', '8,5', '10', '15', 'Outro'].map((val) => {
                  const selected = desiredPower === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDesiredPower(val)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-bold border transition',
                        selected
                          ? 'border-blue-600 bg-blue-50/90 text-blue-600 ring-2 ring-blue-500/10'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>

              {desiredPower === 'Outro' && (
                <div className="mt-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 12.5"
                    value={customPower}
                    onChange={(e) => setCustomPower(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Tipo de instalação */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Tipo de instalação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'Telhado',
                    label: 'Telhado',
                    icon: Home,
                    accent: 'from-amber-100 to-blue-100',
                  },
                  {
                    id: 'Solo',
                    label: 'Solo',
                    icon: Layers,
                    accent: 'from-emerald-100 to-sky-100',
                  },
                  {
                    id: 'Carport',
                    label: 'Carport',
                    icon: Car,
                    accent: 'from-indigo-100 to-slate-200',
                  },
                ].map((item) => {
                  const active = installType === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInstallType(item.id as 'Telhado' | 'Solo' | 'Carport')}
                      className={cn(
                        'relative rounded-2xl border p-3 flex flex-col items-center justify-center gap-1.5 transition',
                        active
                          ? 'border-blue-600 bg-blue-50/40 text-blue-600 ring-2 ring-blue-500/10 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                      )}
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-blue-900 shadow-2xs',
                          item.accent
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Necessita Financiamento? */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Necessita financiamento?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Sim', val: true },
                  { label: 'Não', val: false },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setNeedsFinancing(opt.val)}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold border transition',
                      needsFinancing === opt.val
                        ? 'border-blue-600 bg-blue-50/70 text-blue-600 ring-2 ring-blue-500/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                Observações (opcional)
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={500}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Descreva detalhes adicionais do seu telhado ou necessidade..."
                  className="w-full p-2.5 text-xs text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-none resize-none"
                />
                <span className="absolute bottom-2 right-2.5 text-[10px] text-slate-400">
                  {requestNotes.length}/500
                </span>
              </div>
            </div>

            {submitError && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {submitError}
              </div>
            )}

            {/* CTA Enviar Solicitação */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSend}
              className="w-full py-3 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-extrabold shadow-2xs transition active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        ) : (
          /* TELA 5: CONFIRMAÇÃO ("Solicitação enviada!") */
          <div className="my-auto text-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1 max-w-xs mx-auto">
              <h3 className="text-lg font-extrabold text-slate-900">
                Solicitação enviada!
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A <strong className="text-slate-700">{targetSupplier}</strong> recebeu sua solicitação de{' '}
                <strong>{desiredPower === 'Outro' ? customPower || 'Personalizada' : desiredPower} kWp</strong> ({installType}) e entrará em contato em breve.
              </p>
            </div>

            {/* Box Informativo com 3 itens */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Você será notificado sobre o andamento</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Pode conversar com a empresa pelo chat</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Todas as propostas ficam salvas em Meus Projetos</span>
              </div>
            </div>

            {/* CTAs Primário e Secundário */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  if (onSuccessNavigateChat) onSuccessNavigateChat(targetSupplier);
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
              >
                Conversar agora
              </button>

              <button
                type="button"
                onClick={() => {
                  handleReset();
                  if (onSuccessNavigateHub) onSuccessNavigateHub();
                }}
                className="w-full py-3 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50/50 text-xs font-bold transition"
              >
                Ver minhas propostas
              </button>
            </div>

            {/* Card Inferior "Enquanto isso, compare propostas" */}
            <button
              type="button"
              onClick={() => {
                handleReset();
                if (onSuccessNavigateCompare) onSuccessNavigateCompare();
              }}
              className="w-full rounded-2xl border border-slate-200/90 p-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    Enquanto isso, compare propostas
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug truncate">
                    Analise outras propostas recebidas para encontrar a melhor opção.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
